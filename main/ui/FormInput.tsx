export default function FormInput(props: {
  id: string;
  type: string;
  placeholder: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <label className="mb-3 mt-5" htmlFor={props.id}>
        {props.label}
        {props.required && <span className="text-red-500">*</span>}
      </label>

      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] text-sm outline-2"
        id={props.id}
        type={props.type}
        name={props.id}
        placeholder={props.placeholder}
        required={props.required}
      />
    </div>
  );
}
