import { Document, Model } from "mongoose";

interface MonthData {
  month: string;
  count: number;
}


 

export async function generateLast12MonthsData<T extends Document>(
  model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];
  const currentDate = new Date();

  // loop over last 12 months
  for (let i = 11; i >= 0; i--) {
    // target month (going back i months)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() - i;

    // start of that month
    const startDate = new Date(year, month, 1, 0, 0, 0);
    // start of next month
    const endDate = new Date(year, month + 1, 1, 0, 0, 0);

    // format like "Sep 2025"
    const monthYear = startDate.toLocaleDateString("default", {
      month: "short",
      year: "numeric",
    });

    // count documents created in this month
    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    last12Months.push({ month: monthYear, count });
  }

  return { last12Months };
}







// export async function generateLast12MonthsData<T extends Document>(
//   model: Model<T>
// ): Promise<{ last12Months: MonthData[] }> {
//   const last12Months: MonthData[] = [];
//   const currentDate = new Date();

//   currentDate.setDate(currentDate.getDate() + 1);

//   //generate last 12 month analytics
//   for (let i = 11; i >= 0; i--) {
//     const endDate = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       currentDate.getDate() - i * 28
//     );
//     const startDate = new Date(
//       endDate.getFullYear(),
//       endDate.getMonth(),
//       endDate.getDate() - i
//     );

//     const monthYear = endDate.toLocaleDateString("default", {
//       day: "numeric",
//       month: "short",
//       year: "numeric",
//     });
//     const count = await model.countDocuments({
//       createdAt: {
//         $gte: startDate,
//         $lt: endDate,
//       },
//     });

//     last12Months.push({ month: monthYear, count });
//   }

//   return { last12Months };
// }

 