import UserHealth from '../../models/userHealth.model.js';
import {
  buildAiMemorySummary,
  MAX_PROGRESS_NOTES,
  saveUserMemory,
} from '../../services/aiMemory.service.js';

jest.mock('../../models/userHealth.model.js', () => {
  const MockUserHealthModel = jest.fn();
  MockUserHealthModel.findOne = jest.fn();
  MockUserHealthModel.updateOne = jest.fn();

  return {
    __esModule: true,
    default: MockUserHealthModel,
  };
});

describe('aiMemory.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    UserHealth.updateOne.mockResolvedValue({ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedId: null });
    UserHealth.mockImplementation((doc) => ({
      ...doc,
      save: jest.fn().mockResolvedValue(true),
    }));
  });

  test('buildAiMemorySummary formats diet stage, goals, and progress notes', () => {
    const summary = buildAiMemorySummary('GAPS', {
      dietStage: {
        value: 'Stage 3',
        updatedAt: new Date('2025-01-03T00:00:00.000Z'),
        source: 'user_reported',
      },
      activeGoals: [
        {
          goal: 'Reduce bloating',
          priority: 'primary',
          category: 'symptom',
          status: 'active',
          updatedAt: new Date('2025-01-03T00:00:00.000Z'),
          source: 'user_reported',
        },
        {
          goal: 'Chew meals more slowly',
          priority: 'secondary',
          category: 'behavior',
          status: 'active',
          updatedAt: new Date('2025-01-04T00:00:00.000Z'),
          source: 'user_reported',
        },
      ],
      progressNotes: [
        {
          type: 'tolerance',
          summary: 'Egg yolks have been going well this week.',
          relatedGoal: 'Reduce bloating',
          createdAt: new Date('2025-01-05T00:00:00.000Z'),
          source: 'user_reported',
        },
      ],
    });

    expect(summary).toContain('Current Diet Stage: Stage 3');
    expect(summary).toContain('Primary Goal: Reduce bloating');
    expect(summary).toContain('Secondary Goals: Chew meals more slowly');
    expect(summary).toContain('tolerance: Egg yolks have been going well this week.');
  });

  test('rejects an invalid diet stage for the current primary diet', async () => {
    UserHealth.findOne.mockResolvedValue({
      aiMemory: {},
      save: jest.fn().mockResolvedValue(true),
    });

    await expect(
      saveUserMemory({
        userId: 'user-1',
        firebaseUID: 'firebase-1',
        primaryDiet: 'SCD',
        memory: {
          type: 'diet_stage',
          dietStage: 'Stage 6',
        },
      })
    ).rejects.toThrow('is not valid for primary diet');
  });

  test('requires clarification before replacing an existing primary goal', async () => {
    UserHealth.findOne.mockResolvedValue({
      aiMemory: {
        activeGoals: [
          {
            goal: 'Reduce bloating',
            priority: 'primary',
            category: 'symptom',
            status: 'active',
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            source: 'user_reported',
          },
        ],
      },
      save: jest.fn().mockResolvedValue(true),
    });

    await expect(
      saveUserMemory({
        userId: 'user-1',
        firebaseUID: 'firebase-1',
        primaryDiet: 'GAPS',
        memory: {
          type: 'goal',
          goal: 'Maintain remission',
          priority: 'primary',
          category: 'clinical',
        },
      })
    ).rejects.toThrow('Clarification required before replacing the current primary goal.');
  });

  test('demotes the old primary goal and respects the secondary cap after clarification', async () => {
    const existingHealth = {
      aiMemory: {
        activeGoals: [
          {
            goal: 'Reduce bloating',
            priority: 'primary',
            category: 'symptom',
            status: 'active',
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            source: 'user_reported',
          },
          {
            goal: 'Chew slowly',
            priority: 'secondary',
            category: 'behavior',
            status: 'active',
            updatedAt: new Date('2025-01-02T00:00:00.000Z'),
            source: 'user_reported',
          },
          {
            goal: 'Eat more broth',
            priority: 'secondary',
            category: 'behavior',
            status: 'active',
            updatedAt: new Date('2025-01-03T00:00:00.000Z'),
            source: 'user_reported',
          },
        ],
      },
      save: jest.fn().mockResolvedValue(true),
    };
    UserHealth.findOne.mockResolvedValue(existingHealth);

    const result = await saveUserMemory({
      userId: 'user-1',
      firebaseUID: 'firebase-1',
      primaryDiet: 'GAPS',
      memory: {
        type: 'goal',
        goal: 'Maintain remission',
        priority: 'primary',
        category: 'clinical',
        existingPrimaryBehavior: 'demote_to_secondary',
        dropGoal: 'Chew slowly',
      },
    });

    const activePrimaryGoals = result.aiMemory.activeGoals.filter(
      (goal) => goal.status === 'active' && goal.priority === 'primary'
    );
    const activeSecondaryGoals = result.aiMemory.activeGoals.filter(
      (goal) => goal.status === 'active' && goal.priority === 'secondary'
    );

    expect(activePrimaryGoals).toHaveLength(1);
    expect(activePrimaryGoals[0].goal).toBe('Maintain remission');
    expect(activeSecondaryGoals.map((goal) => goal.goal)).toEqual(
      expect.arrayContaining(['Reduce bloating', 'Eat more broth'])
    );
    expect(activeSecondaryGoals.map((goal) => goal.goal)).not.toContain('Chew slowly');
  });

  test('applies FIFO eviction to progress notes', async () => {
    const existingNotes = Array.from({ length: MAX_PROGRESS_NOTES }, (_, index) => ({
      type: 'milestone',
      summary: `note-${index}`,
      createdAt: new Date(`2025-01-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`),
      source: 'user_reported',
    }));

    UserHealth.findOne.mockResolvedValue({
      aiMemory: {
        progressNotes: existingNotes,
      },
      save: jest.fn().mockResolvedValue(true),
    });

    const result = await saveUserMemory({
      userId: 'user-1',
      firebaseUID: 'firebase-1',
      primaryDiet: 'GAPS',
      memory: {
        type: 'progress_note',
        noteType: 'win',
        summary: 'Handled broth prep more easily this weekend.',
      },
    });

    expect(result.aiMemory.progressNotes).toHaveLength(MAX_PROGRESS_NOTES);
    expect(result.aiMemory.progressNotes.map((note) => note.summary)).not.toContain('note-0');
    expect(result.aiMemory.progressNotes[result.aiMemory.progressNotes.length - 1].summary).toBe(
      'Handled broth prep more easily this weekend.'
    );
  });

  test('rejects flattened goal payloads that omit required goal fields', async () => {
    await expect(
      saveUserMemory({
        userId: 'user-1',
        firebaseUID: 'firebase-1',
        primaryDiet: 'GAPS',
        memory: {
          type: 'goal',
          goal: 'Maintain remission',
        },
      })
    ).rejects.toThrow('Goal memory requires a valid priority.');
  });

  test('throws when updateOne is a no-op (write verification)', async () => {
    UserHealth.findOne.mockResolvedValue({ aiMemory: {} });
    UserHealth.updateOne.mockResolvedValue({ acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: null });

    await expect(
      saveUserMemory({
        userId: 'user-1',
        firebaseUID: 'firebase-1',
        primaryDiet: 'GAPS',
        memory: { type: 'diet_stage', dietStage: 'Stage 2' },
      })
    ).rejects.toThrow('Chef Kay memory save did not persist');
  });

  test('saves aiMemory with updateOne so unrelated legacy fields do not block persistence', async () => {
    const saveSpy = jest.fn().mockRejectedValue(new Error('legacy full-document validation should not run'));

    UserHealth.findOne.mockResolvedValue({
      aiMemory: {},
      weight: {
        value: 170,
        unit: '',
      },
      save: saveSpy,
    });

    const result = await saveUserMemory({
      userId: 'user-1',
      firebaseUID: 'firebase-1',
      primaryDiet: 'GAPS',
      memory: {
        type: 'diet_stage',
        dietStage: 'Stage 2',
      },
    });

    expect(result.aiMemory.dietStage.value).toBe('Stage 2');
    expect(saveSpy).not.toHaveBeenCalled();
    expect(UserHealth.updateOne).toHaveBeenCalledWith(
      { firebaseUID: 'firebase-1' },
      expect.objectContaining({
        $set: expect.objectContaining({
          aiMemory: expect.objectContaining({
            dietStage: expect.objectContaining({
              value: 'Stage 2',
            }),
          }),
        }),
        $setOnInsert: {
          userId: 'user-1',
          firebaseUID: 'firebase-1',
        },
      }),
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: false,
      }
    );
  });
});
