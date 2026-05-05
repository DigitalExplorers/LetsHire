// import React from "react";

// const hiringStagesData = [
//   {
//     category: "Customer Support roles",
//     roles: [
//       {
//         title: "Onboarding Specialist",
//         applications: 105,
//         screened: 48,
//         firstInterview: 6,
//         secondInterview: 2,
//       },
//       {
//         title: "CS Agent",
//         applications: 156,
//         screened: 78,
//         firstInterview: 13,
//         secondInterview: 4,
//       },
//       {
//         title: "Snr. CS Agent",
//         applications: 198,
//         screened: 89,
//         firstInterview: 12,
//         secondInterview: 5,
//       },
//     ],
//   },
//   {
//     category: "Engineering roles",
//     roles: [
//       {
//         title: "QA Engineer",
//         applications: 42,
//         screened: 22,
//         firstInterview: 10,
//         secondInterview: 3,
//       },
//       {
//         title: "Snr. Sales Engineer",
//         applications: 10,
//         screened: 8,
//         firstInterview: 5,
//         secondInterview: 0,
//       },
//     ],
//   },
// ];

// const HiringStagesChart: React.FC = () => {
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//       {hiringStagesData.map((category, index) => (
//         <div key={index} className="bg-gray-100 p-5 rounded-lg shadow-md">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             {category.category}
//           </h3>
//           <div className="grid gap-4">
//             {category.roles.map((role, idx) => (
//               <div key={idx} className="p-4 bg-white rounded-lg shadow">
//                 <h4 className="text-md font-semibold text-gray-800">
//                   {role.title}
//                 </h4>
//                 <div className="mt-2">
//                   <p className="text-gray-600">Applications: {role.applications}</p>
//                   <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
//                     <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(role.screened / role.applications) * 100}%` }}></div>
//                   </div>
//                 </div>
//                 <div className="mt-2">
//                   <p className="text-gray-600">Screened: {role.screened}</p>
//                   <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
//                     <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(role.firstInterview / role.screened) * 100}%` }}></div>
//                   </div>
//                 </div>
//                 <div className="mt-2">
//                   <p className="text-gray-600">1st Interview: {role.firstInterview}</p>
//                   <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
//                     <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${(role.secondInterview / role.firstInterview) * 100}%` }}></div>
//                   </div>
//                 </div>
//                 <div className="mt-2">
//                   <p className="text-gray-600">2nd Interview: {role.secondInterview}</p>
//                   <div className="w-full bg-gray-300 h-2 rounded-full mt-1">
//                     <div className="bg-red-600 h-2 rounded-full" style={{ width: `${role.secondInterview > 0 ? 100 : 0}%` }}></div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default HiringStagesChart;


import React from "react";

const hiringStagesData = [
  {
    category: "Customer Support roles",
    roles: [
      {
        title: "Onboarding Specialist",
        applications: 105,
        screened: 48,
        firstInterview: 6,
        secondInterview: 2,
      },
      {
        title: "CS Agent",
        applications: 156,
        screened: 78,
        firstInterview: 13,
        secondInterview: 4,
      },
      {
        title: "Snr. CS Agent",
        applications: 198,
        screened: 89,
        firstInterview: 12,
        secondInterview: 5,
      },
    ],
  },
  {
    category: "Engineering roles",
    roles: [
      {
        title: "QA Engineer",
        applications: 42,
        screened: 22,
        firstInterview: 10,
        secondInterview: 3,
      },
      {
        title: "Snr. Sales Engineer",
        applications: 10,
        screened: 8,
        firstInterview: 5,
        secondInterview: 0,
      },
    ],
  },
];

const HiringStagesChart: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Hiring Stages Overview
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-center">Applications</th>
              <th className="p-3 text-center">Screened</th>
              <th className="p-3 text-center">1st Interview</th>
              <th className="p-3 text-center">2nd Interview</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {hiringStagesData.map((category, categoryIndex) => (
              <React.Fragment key={categoryIndex}>
                {category.roles.map((role, roleIndex) => (
                  <tr
                    key={roleIndex}
                    className="border-t border-gray-300 hover:bg-gray-50 transition"
                  >
                    {roleIndex === 0 && (
                      <td
                        rowSpan={category.roles.length}
                        className="p-3 text-left font-semibold"
                      >
                        {category.category}
                      </td>
                    )}
                    <td className="p-3 text-left">{role.title}</td>
                    <td className="p-3 text-center">{role.applications}</td>
                    <td className="p-3 text-center">{role.screened}</td>
                    <td className="p-3 text-center">{role.firstInterview}</td>
                    <td className="p-3 text-center">{role.secondInterview}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HiringStagesChart;

