import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
type ToasterProps = React.ComponentProps<typeof Sonner>;
const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme();
    return (<Sonner 
        theme="light" 
        className="toaster group" 
        position="bottom-right"
        toastOptions={{
            classNames: {
                toast: "!bg-white !text-gray-900 !border !border-gray-200 !shadow-xl !rounded-lg !p-4",
                description: "!text-gray-700 !text-sm",
                actionButton: "!bg-blue-600 !text-white !hover:bg-blue-700",
                cancelButton: "!bg-gray-300 !text-gray-900 !hover:bg-gray-400",
                success: "!bg-green-50 !border-green-200 !text-green-900",
                error: "!bg-red-50 !border-red-200 !text-red-900",
                warning: "!bg-yellow-50 !border-yellow-200 !text-yellow-900",
                info: "!bg-blue-50 !border-blue-200 !text-blue-900",
            },
        }} 
        {...props}/>);
};
export { Toaster, toast };
