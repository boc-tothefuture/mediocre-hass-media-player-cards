import {
  Toggle as ToggleComponent,
  ToggleContainer,
  ToggleLabel,
} from "@components/FormElements";
import { useFieldContext } from "../hooks/useAppForm";

export function Toggle({
  label,
  defaultValue = false,
}: {
  label: string;
  defaultValue?: boolean;
}) {
  const field = useFieldContext<boolean | undefined>();
  return (
    <ToggleContainer>
      <ToggleComponent
        id={field.name}
        checked={field.state.value ?? defaultValue}
        onChange={e =>
          field.handleChange((e.target as HTMLInputElement)?.checked ?? false)
        }
      />
      <ToggleLabel htmlFor={field.name}>{label}</ToggleLabel>
    </ToggleContainer>
  );
}
