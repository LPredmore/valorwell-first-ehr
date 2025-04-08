
import ForgotPasswordComponent from "@/components/auth/ForgotPassword";
import { Card, CardContent } from "@/components/ui/card";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <ForgotPasswordComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
