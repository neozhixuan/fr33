export default function FormInput({
  id,
  label,
  required, // Intersection clause means we can strongly override base attributes
  ...rest
}: {
  id: string;
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <label className="mb-3 mt-5" htmlFor={id}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2"
        name={id}
        required={required}
        {...rest}
      />
    </div>
  );
}
