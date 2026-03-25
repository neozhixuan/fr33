type RoleToggleButtonProps = {
    roleName: string;
    isActive: boolean;
    onClick: () => void;
}

export function RoleToggleButton({ roleName, isActive, onClick }: RoleToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] ${isActive
                ? "bg-[#00f2ff] text-[#00363a]"
                : "border border-white/20 text-[#e5e2e3]"
                }`}
        >
            {roleName}
        </button>

    )
}