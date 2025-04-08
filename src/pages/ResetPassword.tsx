
import ResetPasswordComponent from "@/components/auth/ResetPassword";
import { Card, CardContent } from "@/components/ui/card";

const ResetPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <ResetPasswordComponent />
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
