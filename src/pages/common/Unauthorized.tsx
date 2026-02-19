import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div className="flex justify-center">
                    <div className="bg-red-100 p-4 rounded-full">
                        <ShieldAlert className="w-16 h-16 text-red-600" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        Access Denied
                    </h1>
                    <p className="text-lg text-gray-600">
                        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-2 transition-all duration-200 hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => navigate("/")}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                    >
                        <Home className="w-4 h-4" />
                        Home Page
                    </Button>
                </div>

                <div className="pt-8 border-t border-gray-100 mt-8">
                    <p className="text-sm text-gray-400">
                        Error Code: 403 Forbidden
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
