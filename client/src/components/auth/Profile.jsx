import { app } from '../../config/firestore.js'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { API_BASE_URL } from '../../env-config.js'
import { useUser } from '../../context/UserContext.jsx';
import { useQueryInvalidation } from '../../hooks/useUserQueries.js';
import { CreditStatusCard } from '../CreditBalanceBadge.jsx';
import ResetPassword from './ResetPassword.jsx';
import ProfileAvatarUpload from './ProfileAvatarUpload.jsx';
import SessionContextWidget from '../../context/SessionContextWidget.jsx';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import ianaTimeZones from '../utils/timezones.js'

// LUCIDE ICONS
import { Edit, Save } from 'lucide-react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// MATERIAL UI
import Button from '@mui/material/Button'
import { TextField } from '@mui/material'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress'
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import LogoutButton from './LogoutButton.jsx' // not used



function Profile() {

  const { fetchSessionContext } = useUser();
  const { invalidateUser } = useQueryInvalidation();
  const navigate = useNavigate()
  const auth = getAuth(app)
  const userName = auth.currentUser?.displayName
  const email = auth.currentUser?.email
  const [loading, setLoading] = useState(true)
  const [consistency, setConsistency] = useState('not consistent')
  const [userFirstName, setUserFirstName] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const tierBasicUses = 2
  const tierPremiumUses = 6

  // Format date to be user-friendly
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';

    // Options for formatting the date
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    return date.toLocaleString(undefined, options);
  };

  // Calculate time since last login
  const timeSinceLastLogin = (dateString) => {
    if (!dateString) return 'Never logged in';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  };

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profileImageUrl: null,
    isAdmin: null,
    conditionTreating: '',
    inFlare: false,
    primaryDiet: '',
    dietaryRestrictions: [],
    customDietaryRestrictions: [],
    weightValue: '',
    weightUnit: '',
    sex: '',
    timezone: '',
    membershipPlan: '',
    accountCreationDate: new Date(),
    lastLogin: null,
    previousLastLogin: null,
    loginHistory: ''
  })

  const [originalUserData, setOriginalUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [availableConditions, setAvailableConditions] = useState([]);
  const [availablePrimaryDiets, setAvailablePrimaryDiets] = useState([]);
  const [availableRestrictions, setAvailableRestrictions] = useState([]);
  const [filteredRestrictions, setFilteredRestrictions] = useState([]);
  const [dietsLoading, setDietsLoading] = useState(true);
  const [annualBilling, setAnnualBilling] = useState(false);
  const [restrictionInputValue, setRestrictionInputValue] = useState('');

  const monthlyPrice = 10;
  const headingFont = { fontFamily: 'Montserrat, sans-serif' };
  const bodyFont = { fontFamily: '"Source Sans Pro", sans-serif' };

  useEffect(() => {
    fetchSessionContext();
  }, [fetchSessionContext]);

  const fetchConditions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conditions`);
      const data = await response.json();
      setAvailableConditions(data);
    } catch (error) {
      //console.log('Error fetching conditions:', error);
    }
  };

  const fetchPrimaryDiets = async () => {
    setDietsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/therapeutic-diets?diet_type=primary`);
      if (!response.ok) throw new Error('Failed to fetch primary diets');
      const data = await response.json();
      setAvailablePrimaryDiets(data);
    } catch (error) {
      console.error('Error fetching primary diets:', error);
    } finally {
      setDietsLoading(false);
    }
  };

  const fetchRestrictions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/therapeutic-diets?diet_type=restriction`);
      if (!response.ok) throw new Error('Failed to fetch restrictions');
      const data = await response.json();
      setAvailableRestrictions(data);
    } catch (error) {
      console.error('Error fetching restrictions:', error);
    }
  };


  const handleProfileImageUploadSuccess = (newProfileImageUrl) => {
    // Update local state
    setUserData(prev => ({
      ...prev,
      profileImageUrl: newProfileImageUrl
    }));

    // Invalidate user cache to trigger refetch
    invalidateUser();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  const handleAutocompleteChange = (name, newValue) => {
    let valueToSet = '';
    if (newValue) {
      if (name === 'conditionTreating') valueToSet = newValue.condition_name;
      else if (name === 'primaryDiet') valueToSet = newValue.diet_code;
      else if (name === 'dietaryRestrictions') {
        // This now handles a mix of strings (custom) and objects (predefined)
        const allRestrictions = newValue.map(option =>
          typeof option === 'string' ? option : option.diet_code
        );
        const predefined = allRestrictions.filter(r => availableRestrictions.some(ar => ar.diet_code === r));
        const custom = allRestrictions.filter(r => !availableRestrictions.some(ar => ar.diet_code === r));

        setUserData(prev => ({
          ...prev,
          dietaryRestrictions: predefined,
          customDietaryRestrictions: custom
        }));
        return; // Exit early as we've already set the state
      }
      else if (name === 'timezone') valueToSet = newValue;
    }
    setUserData(prev => ({
      ...prev,
      [name]: valueToSet
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (!auth.currentUser) {
        throw new Error("User not logged in");
      }

      // Construct a new object with only the fields that should be updated.
      const updatePayload = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        conditionTreating: userData.conditionTreating,
        primaryDiet: userData.primaryDiet,
        dietaryRestrictions: userData.dietaryRestrictions,
        customDietaryRestrictions: userData.customDietaryRestrictions,
        weightValue: userData.weightValue,
        weightUnit: userData.weightUnit,
        sex: userData.sex,
        timezone: userData.timezone,
        inFlare: userData.inFlare,
      };

      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/users/${auth.currentUser.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updatePayload) // Send the sanitized payload
      });

      if (response.ok) {
        setIsEditing(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        setOriginalUserData(null);
        invalidateUser(); // TanStack Query: trigger refetch of user data
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setIsLoading(true);
        try {
          const idToken = await auth.currentUser.getIdToken();
          const response = await fetch(`${API_BASE_URL}/api/users/${auth.currentUser.uid}`, {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });

          if (!response.ok) {
            let errorBody = 'Could not read error body';
            try {
              errorBody = await response.text();
            } catch (e) { /* ignore */ }
            console.error(`(Profile.jsx) - Fetch error status: ${response.status}, body: ${errorBody}`);
            throw new Error(`Failed to fetch user data (status ${response.status})`);
          }

          const apiUserData = await response.json();
          setUserData({
            firstName: apiUserData.firstName || '',
            lastName: apiUserData.lastName || '',
            email: apiUserData.email || auth.currentUser.email || '',
            profileImageUrl: apiUserData.profileImageUrl || null,
            isAdmin: apiUserData.isAdmin || null,
            conditionTreating: apiUserData.conditionTreating || '',
            inFlare: apiUserData.inFlare || false,
            primaryDiet: apiUserData.primaryDiet || '',
            dietaryRestrictions: apiUserData.dietaryRestrictions || [],
            customDietaryRestrictions: apiUserData.customDietaryRestrictions || [],
            weightValue: apiUserData.weightValue || '',
            weightUnit: apiUserData.weightUnit || '',
            sex: apiUserData.sex || '',
            timezone: apiUserData.timezone || '',
            membershipPlan: apiUserData.paymentStatus?.plan || '',
            accountCreationDate: apiUserData.createdAt || '',
            //lastLoginDate: apiUserData.lastLogin || '',
            lastLogin: apiUserData.lastLogin || null,
            previousLastLogin: apiUserData.previousLastLogin || null,
            loginHistory: apiUserData.loginHistory || '',
          });
          setIsAdmin(apiUserData.isAdmin === true);

          await Promise.all([
            fetchConditions(),
            fetchPrimaryDiets(),
            fetchRestrictions(),
          ]);

        } catch (error) {
          console.error('Error fetching user data', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // No user, stop loading
      }
    };

    fetchUserData();
  }, [auth.currentUser]); // Rerun when auth.currentUser changes

  useEffect(() => {
    const exclusionMap = {
      'SCD': ['Gluten-Free Diet'],
      'GAPS': ['Gluten-Free Diet'],
      'Paleo AIP': ['Gluten-Free Diet', 'Dairy-Free Diet', 'Nut-Free Diet'],
      'Low Fiber': ['Nut-Free Diet'],
    };

    const excludedForSelectedDiet = exclusionMap[userData.primaryDiet] || [];

    const filtered = availableRestrictions.filter(
      (restriction) => !excludedForSelectedDiet.includes(restriction.diet_name)
    );
    setFilteredRestrictions(filtered);

    // Only filter user's restrictions if we have the reference list loaded.
    // This prevents wiping the user's data during the initial render race caused by Promise.all
    if (availableRestrictions.length > 0) {
      setUserData((prev) => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.filter((restrictionCode) => {
          const restrictionDetails = availableRestrictions.find(r => r.diet_code === restrictionCode);
          return restrictionDetails && !excludedForSelectedDiet.includes(restrictionDetails.diet_name);
        }),
      }));
    }
  }, [userData.primaryDiet, availableRestrictions]);


  const [disease, setDisease] = useState('')

  const handleDisease = (event) => {
    setDisease(event.target.value)
    //console.log(`User selected disease: ${disease}`)
  }

  const [diet, setDiet] = useState('')

  const handleDiet = (event) => {
    setDiet(event.target.value)
    //console.log(`User selected diet: ${diet}`)
  }

  const isHealthProfileIncomplete = !userData.primaryDiet || !userData.conditionTreating;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return <div className='m-8'>Loading...</div>;
  }


  const formatCSTTime = (utcTimestamp) => {
    const date = new Date(utcTimestamp)

    return date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <>
      <div className='px-4 md:px-8 py-6 w-full'>
        <div className='flex flex-col gap-6 pb-8 w-full items-stretch'>
          {isHealthProfileIncomplete && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                fontSize: '1rem',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                '& .MuiAlert-icon': { fontSize: '2rem' },
              }}
            >
              <Button
                component={Link}
                to="/quick_start_guide"
                color="inherit"
                size="normal"
                variant="outlined"
              >
                Set up diet plan
              </Button>
              <Typography variant="body1" sx={{ fontWeight: 'normal', py: 1 }}>
                Finish setting your primary diet and condition to personalize your recipes.
              </Typography>
            </Alert>
          )}
          <div className='flex flex-col md:flex-row items-center md:items-start gap-4'>
            <ProfileAvatarUpload
              firebaseUser={auth.currentUser}
              customProfileImageUrl={userData.profileImageUrl}
              firstName={userData.firstName}
              lastName={userData.lastName}
              onUploadSuccess={handleProfileImageUploadSuccess}
            />
            <div className='flex flex-col gap-2'>
              <h1 className='text-2xl md:text-4xl'>
                {userData.firstName.charAt(0).toUpperCase() + userData.firstName.slice(1)}'s Profile
              </h1>
            </div>
          </div>
          <div className="flex flex-row justify-start">
            {isAdmin && (
              <Box mt={2} sx={{ display: 'flex', gap: 2 }}>
                <Button
                  component={Link}
                  to="/admin"
                  variant="contained"
                  color="secondary"
                >
                  Admin Panel
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/admin/food_db_admin')}
                >
                  Food DB Admin
                </Button>
                <Button component={Link} to="/admin/ai_responses_admin" variant="contained" color="secondary">
                  AI Responses Admin
                </Button>
              </Box>
            )}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <CreditStatusCard />
            <SessionContextWidget />
          </div>

          <div className='flex flex-col md:flex-row gap-6 items-start w-full'>
            <div className='flex-grow flex flex-col gap-6 w-full'>
              <Card elevation={3}>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <Typography variant='h5' component='div'>
                      Profile Information
                    </Typography>
                    {!isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setOriginalUserData(userData);
                            setIsEditing(true);
                            setSaveSuccess(false);
                          }}
                          startIcon={<Edit />}
                        >
                          Edit Profile
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => {
                            if (originalUserData) {
                              setUserData(originalUserData);
                            }
                            setIsEditing(false);
                            setOriginalUserData(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleUpdateProfile}
                          disabled={isLoading}
                          startIcon={isLoading ? <CircularProgress size={20} /> : <Save />}
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {saveSuccess && (
                    <Alert severity="success" className="mb-4">
                      Profile updated successfully!
                    </Alert>
                  )}

                  {isLoading && !isEditing ? (
                    <div className="flex justify-center py-8">
                      <CircularProgress />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isEditing ? (
                        <>
                          <TextField
                            label="First Name"
                            variant="outlined"
                            name="firstName"
                            value={userData.firstName}
                            onChange={handleInputChange}
                            fullWidth
                          />
                          <TextField
                            label="Last Name"
                            variant="outlined"
                            name="lastName"
                            value={userData.lastName}
                            onChange={handleInputChange}
                            fullWidth
                          />
                          <TextField
                            label="Email"
                            variant="outlined"
                            name="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            fullWidth
                            disabled
                          />

                          <Autocomplete
                            options={availableConditions}
                            getOptionLabel={(option) => option.condition_name || ''}
                            value={availableConditions.find(c => c.condition_name === userData.conditionTreating) || null}
                            onChange={(event, newValue) => handleAutocompleteChange('conditionTreating', newValue)}
                            isOptionEqualToValue={(option, value) => option.condition_name === value?.condition_name}
                            renderInput={(params) => (<TextField {...params} label="Medical Condition" variant="outlined" fullWidth />)}
                            fullWidth ListboxProps={{ style: { maxHeight: 200 } }}
                          />

                          <Autocomplete
                            options={availablePrimaryDiets}
                            getOptionLabel={(option) => option.diet_name || ''}
                            value={availablePrimaryDiets.find(d => d.diet_code === userData.primaryDiet) || null}
                            onChange={(event, newValue) => handleAutocompleteChange('primaryDiet', newValue)}
                            isOptionEqualToValue={(option, value) => option.diet_code === value?.diet_code}
                            renderInput={(params) => (<TextField {...params} label="Primary Diet" variant="outlined" fullWidth />)}
                            fullWidth ListboxProps={{ style: { maxHeight: 200 } }}
                          />

                          <Autocomplete
                            multiple
                            freeSolo
                            disableCloseOnSelect
                            options={filteredRestrictions}
                            getOptionLabel={(option) => option.diet_name || option}
                            value={[...userData.dietaryRestrictions.map(code => availableRestrictions.find(r => r.diet_code === code)).filter(Boolean), ...userData.customDietaryRestrictions]}
                            inputValue={restrictionInputValue}
                            onInputChange={(event, newInputValue) => {
                              setRestrictionInputValue(newInputValue);
                            }}
                            onChange={(event, newValue) => handleAutocompleteChange('dietaryRestrictions', newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select or Add Restrictions"
                                helperText="Select from the list or type your own. Press Enter, Comma, or Click to add."
                                variant="outlined"
                                fullWidth
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                                    if (restrictionInputValue.trim()) {
                                      e.preventDefault();
                                      const currentValues = [
                                        ...userData.dietaryRestrictions.map(code => availableRestrictions.find(r => r.diet_code === code)).filter(Boolean),
                                        ...userData.customDietaryRestrictions
                                      ];
                                      const newVal = restrictionInputValue.trim();

                                      // Check for duplicates
                                      const alreadyExists = currentValues.some(v =>
                                        (typeof v === 'object' ? v.diet_name === newVal : v === newVal)
                                      );

                                      if (!alreadyExists) {
                                        handleAutocompleteChange('dietaryRestrictions', [...currentValues, newVal]);
                                      }
                                      setRestrictionInputValue('');
                                    }
                                  }
                                }}
                              />
                            )}
                            fullWidth ListboxProps={{ style: { maxHeight: 200 } }}
                          />

                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormControl fullWidth>
                              <InputLabel id="flare-status-label">Currently in a flare?</InputLabel>
                              <Select
                                labelId="flare-status-label"
                                id="inFlare"
                                name="inFlare"
                                value={userData.inFlare}
                                onChange={handleInputChange}
                                label="Currently in a flare?"
                              >
                                <MenuItem value={true}>Yes</MenuItem>
                                <MenuItem value={false}>No</MenuItem>
                              </Select>
                            </FormControl>

                            <Autocomplete
                              id="timezone-select"
                              options={ianaTimeZones}
                              getOptionLabel={(option) => option}
                              value={userData.timezone || null}
                              onChange={(event, newValue) => handleAutocompleteChange('timezone', newValue)}
                              isOptionEqualToValue={(option, value) => option === value}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Timezone"
                                  variant="outlined"
                                  helperText="Select your local timezone for accurate analysis."
                                  fullWidth
                                />
                              )}
                              fullWidth
                              ListboxProps={{ style: { maxHeight: 200 } }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">First Name</Typography>
                            <Typography variant="body1" className="font-medium">{userData.firstName}</Typography>
                          </div>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">Last Name</Typography>
                            <Typography variant="body1" className="font-medium">{userData.lastName}</Typography>
                          </div>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                            <Typography variant="body1" className="font-medium">{userData.email}</Typography>
                          </div>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">Medical Condition</Typography>
                            <Typography variant="body1" className="font-medium">{userData.conditionTreating || 'Not specified'}</Typography>
                          </div>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">Primary Diet</Typography>
                            <Typography variant="body1" className="font-medium">{userData.primaryDiet || 'Not specified'}</Typography>
                          </div>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">Dietary Restrictions</Typography>
                            <Typography variant="body1" className="font-medium">{[...userData.dietaryRestrictions.map(code => availableRestrictions.find(r => r.diet_code === code)?.diet_name || code), ...userData.customDietaryRestrictions].join(', ') || 'None'}</Typography>
                          </div>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">Currently in a flare?</Typography>
                            <Typography variant="body1" className="font-medium">{userData.inFlare ? 'Yes' : 'No'}</Typography>
                          </div>
                          <div className="profile-info-item">
                            <Typography variant="subtitle2" color="textSecondary">Timezone</Typography>
                            <Typography variant="body1" className="font-medium">{userData.timezone || 'Not set (Defaults to UTC for analysis)'}</Typography>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <Box mt={3} className="border-t pt-3">
                    <Typography variant="h6" component="div" className="mb-2">
                      Security
                    </Typography>
                    <ResetPassword />
                  </Box>
                </CardContent>
              </Card>

              <Card elevation={3}>
                <CardContent>
                  <Typography variant='h5' component='div' sx={{ mb: 3 }}>
                    Account Details
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="profile-info-item">
                      <Typography variant="subtitle2" color="textSecondary">Created On</Typography>
                      <Typography variant="body1" className="font-medium">
                        {formatCSTTime(userData.accountCreationDate)} PST
                      </Typography>
                    </div>
                    <div className="profile-info-item">
                      <Typography variant="subtitle2" color="textSecondary">Last Activity</Typography>
                      <Typography variant="body1" className="font-medium">
                        {timeSinceLastLogin(userData.lastLogin)}
                      </Typography>
                    </div>
                    {userData.previousLastLogin && (
                      <div className="profile-info-item md:col-span-2">
                        <Typography variant="subtitle2" color="textSecondary">Previous Login</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(userData.previousLastLogin)}
                        </Typography>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='w-full md:w-[320px] lg:w-[380px] flex-shrink-0'>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#013D1D' }}>
                    Need help?
                  </Typography>

                  <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                    Support Portal
                  </Typography>

                  <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
                    <ListItem sx={{ display: 'list-item', py: 0.25 }}>
                      <ListItemText primary="Report a bug" />
                    </ListItem>
                    <ListItem sx={{ display: 'list-item', py: 0.25 }}>
                      <ListItemText primary="Suggest improvements" />
                    </ListItem>
                    <ListItem sx={{ display: 'list-item', py: 0.25 }}>
                      <ListItemText primary="Request a new feature" />
                    </ListItem>
                  </List>

                  <Box className='py-2'>
                    <Button
                      href='https://meadowmentor.atlassian.net/servicedesk/customer/portal/1'
                      target='_blank'
                      variant='contained'
                      sx={{ bgcolor: '#013D1D', '&:hover': { bgcolor: '#047857' } }}
                    >
                      Open Support Portal
                    </Button>
                  </Box>

                  <Typography className='pt-6' variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                    Support Email
                  </Typography>

                  <Box className='py-2'>
                    <Button
                      variant='outlined'
                      sx={{ color: '#013D1D', borderColor: '#013D1D' }}
                      onClick={() => {
                        window.open('mailto:support@meadowmentor.atlassian.net?subject=Meadow%20Mentor%20Support%20Request', '_blank');
                      }}
                    >
                      Email Support
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )

}

export default Profile