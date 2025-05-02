
// This is a simple mock to replace @testing-library/react-hooks
export const renderHook = (callback: any) => {
  const result = { current: callback() };
  return { result };
};

export default {
  renderHook
};
