import React from 'react';
import {
  AlertCircle,
  Lock,
  Mail,
  Globe,
  Code,
  Users,
  Settings,
  Sliders,
  Send,
  Gamepad2,
  Utensils,
  CookingPot,
  Sparkles,
  FileText,
  Notebook,
  Pencil,
  ChartSpline,
  Database,
  Bot,
  CircleHelp,
} from 'lucide-react';


// Define feature status types and their corresponding styles
const statusStyles = {
  'done': 'bg-green-100 text-green-800',
  'in progress': 'bg-blue-100 text-blue-800',
  'research/planning': 'bg-gray-100 text-gray-800',
  'not started': 'bg-neutral-100 text-black-800',
  'on pause': 'bg-yellow-100 text-yellow-800',
  'delayed': 'bg-red-100 text-red-800',
};

// Store features data in an array of objects for easy maintenance
const features = [
  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Specific Carbohydrate Diet',
    status: 'done'
  },

  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Gut and Psychology Syndrome Protocol',
    status: 'done'
  },

  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Paleo Autoimmune Protocol',
    status: 'done'
  },

  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Gluten-Free Diet',
    status: 'done'
  },

  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Dairy-Free Diet',
    status: 'done'
  },

  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Nut-Free Diet',
    status: 'done'
  },

  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Mediterranean Diet',
    status: 'done'
  },

  {
    icon: <CookingPot className="w-5 h-5" />,
    name: 'Support for the Ketogenic Diet',
    status: 'research/planning'
  },

  {
    icon: <Notebook className="w-5 h-5" />,
    name: 'Data tracking of meals eaten (Food Journal)',
    status: 'done'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'AI analysis of meals eaten (Food Journal) to improve your diet',
    status: 'done'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'AI generated 7-day meal plans according to your caloric needs',
    status: 'done'
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'AI generated recipes from ingredients you have on hand',
    status: 'done'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'AI generated recipes adapting favorite meals to your diet',
    status: 'done'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'AI answers any questions you have about your diet',
    status: 'done'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'AI checks your packaged food ingredient label for safety according to your diet',
    status: 'done'
  },

  {
    icon: <FileText className="w-5 h-5" />,
    name: "Save and view AI responses to copy to your personal files",
    status: 'done'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'Select from a list of AI conversation styles to get the support you need',
    status: 'done'
  },

  {
    icon: <CircleHelp className="w-5 h-5" />,
    name: 'Onboarding guide to help you get started',
    status: 'in progress'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: "Medical Report Analyzer",
    status: 'on pause'
  },

  {
    icon: <ChartSpline className="w-5 h-5" />,
    name: "See a graph view of your meal compliance scores over time",
    status: 'not started'
  },

  {
    icon: <FileText className="w-5 h-5" />,
    name: "Share your saved AI responses with your support team",
    status: 'not started'
  },

  {
    icon: <Bot className="w-5 h-5" />,
    name: 'AI agent buys groceries from your shopping list',
    status: 'not started'
  },

  {
    icon: <Gamepad2 className="w-5 h-5" />,
    name: 'Gamification',
    status: 'not started'
  },

  {
    icon: <Database className="w-5 h-5" />,
    name: 'Personalized food database',
    status: 'not started'
  },


  {
    icon: <ChartSpline className="w-5 h-5" />,
    name: 'Data tracking of bowel movements',
    status: 'not started'
  },

  {
    icon: <Sparkles className="w-5 h-5" />,
    name: 'AI analysis of bowel movement data to improve your diet',
    status: 'not started'
  },

  {
    icon: <ChartSpline className="w-5 h-5" />,
    name: 'Data tracking of supplements, medications, symptoms, wellness',
    status: 'not started'
  },
  {
    icon: <Users className="w-5 h-5" />,
    name: 'Invite others on your support/healthcare team to view and monitor your progress',
    status: 'not started'
  },


  /*
  {
    icon: <Settings className="w-5 h-5" />,
    name: 'Placeholder 01',
    status: 'done'
  },
  {
    icon: <Sliders className="w-5 h-5" />,
    name: 'Placeholder 02',
    status: 'in progress'
  },
  {
    icon: <Send className="w-5 h-5" />,
    name: 'Placeholder 03',
    status: 'in progress'
  }
  */
];

const RoadmapTable = () => {
  return (
    // Keep overflow-x-auto for safety
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-x-auto">
      <div className="px-3 py-4 sm:px-6 sm:py-5"> {/* Reduced padding */}
        <h3 className="text-xl sm:text-2xl font-bold leading-6 text-gray-900">Roadmap</h3> {/* Reduced font size */}
      </div>

      <div className="border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Further reduced padding, smaller text on mobile */}
              <th scope="col" className="px-2 sm:px-4 md:px-6 py-3 text-left text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              {/* Further reduced padding, smaller text on mobile */}
              <th scope="col" className="px-2 sm:px-4 md:px-6 py-3 text-left text-sm sm:text-base md:text-lg font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {features.map((feature, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {/* Further reduced padding, smaller margin, smaller text */}
                <td className="px-2 sm:px-4 md:px-6 py-4 align-top"> {/* Added align-top */}
                  <div className="flex items-start"> {/* Changed to items-start */}
                    <div className="flex-shrink-0 text-gray-500 pt-1"> {/* Added pt-1 for alignment */}
                      {feature.icon}
                    </div>
                    {/* Reduced margin on small screens */}
                    <div className="ml-2 sm:ml-3 md:ml-4">
                      {/* Reduced font size on small screens */}
                      <div className="text-sm sm:text-base font-medium text-gray-900 break-words"> {/* Added break-words */}
                        {feature.name}
                      </div>
                    </div>
                  </div>
                </td>
                {/* Further reduced padding, smaller text */}
                <td className="px-2 sm:px-4 md:px-6 py-4 align-top"> {/* Added align-top */}
                  {/* Reduced font size and internal padding on small screens */}
                  <span className={`px-1.5 sm:px-2 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${statusStyles[feature.status]}`}>
                    {feature.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoadmapTable;