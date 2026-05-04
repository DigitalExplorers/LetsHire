import { useBranding } from "@/contexts/BrandingContext";

const Loader = () => {
  const { primaryColor } = useBranding();
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
      style={{
        borderColor: `${primaryColor} transparent transparent transparent`,
      }}
      ></div>
    </div>
  );
};

export default Loader;
