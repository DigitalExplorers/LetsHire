import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TableThree from "@/components/Tables/TableThree";

import DefaultLayout from "@/components/Layouts/DefaultLayout";

const TablesPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Candidates" />

      <div className="flex flex-col gap-10">
        <TableThree />
      </div>
    </DefaultLayout>
  );
};

export default TablesPage;
