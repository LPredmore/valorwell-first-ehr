
// This is a partial fix for the specific line causing the error
// We need to replace line 592 that's trying to access other_insurance
// Instead of form.getValues().other_insurance, we'll use a direct reference to the field value

// Replace:
// const hasOtherInsurance = form.getValues().other_insurance === "Yes";

// With:
const otherInsuranceField = form.getValues("other_insurance");
const hasOtherInsurance = otherInsuranceField === "Yes";
