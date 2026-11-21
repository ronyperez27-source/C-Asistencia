import type { FormData, FormErrors } from './empleado.types';
import { CARGOS_OPERATIVOS } from './empleado.types';
import './empleados.css';

interface Props {
  form: FormData;
  errors: FormErrors;
  enviando: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDniKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EmpleadoForm({
  form,
  errors,
  enviando,
  onChange,
  onDniKeyDown,
  onSubmit,
}: Props) {
  return (
    <div className="emp-card">
      <form className="emp-form" onSubmit={onSubmit} noValidate>
        <h2 className="emp-form__title">👷 Registrar Nuevo Empleado</h2>

        {/* ── Nombres ── */}
        <div className="emp-form__field">
          <label htmlFor="nombres" className="emp-form__label">
            Nombres Completos <span className="emp-form__required">*</span>
          </label>
          <input
            id="nombres"
            name="nombres"
            type="text"
            value={form.nombres}
            onChange={onChange}
            placeholder="Ej: Juan Carlos Pérez Flores"
            className={`emp-form__input${errors.nombres ? ' emp-form__input--error' : ''}`}
            autoComplete="off"
          />
          {errors.nombres && <span className="emp-form__error">{errors.nombres}</span>}
        </div>

        {/* ── DNI ── */}
        <div className="emp-form__field">
          <label htmlFor="dni" className="emp-form__label">
            DNI <span className="emp-form__required">*</span>
          </label>
          <input
            id="dni"
            name="dni"
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={form.dni}
            onChange={onChange}
            onKeyDown={onDniKeyDown}
            placeholder="12345678"
            className={`emp-form__input${errors.dni ? ' emp-form__input--error' : ''}`}
            autoComplete="off"
          />
          <span className="emp-form__hint">Exactamente 8 dígitos numéricos.</span>
          {errors.dni && <span className="emp-form__error">{errors.dni}</span>}
        </div>

        {/* ── Cargo ── */}
        <div className="emp-form__field">
          <label htmlFor="cargo" className="emp-form__label">
            Cargo <span className="emp-form__required">*</span>
          </label>
          <select
            id="cargo"
            name="cargo"
            value={form.cargo}
            onChange={onChange}
            className={`emp-form__select${errors.cargo ? ' emp-form__select--error' : ''}`}
          >
            <option value="">— Selecciona un cargo —</option>
            {CARGOS_OPERATIVOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.cargo && <span className="emp-form__error">{errors.cargo}</span>}
        </div>

        {/* ── Tarifa por Hora ── */}
        <div className="emp-form__field emp-form__field--last">
          <label htmlFor="tarifa_hora" className="emp-form__label">
            Tarifa por Hora (S/) <span className="emp-form__required">*</span>
          </label>
          <input
            id="tarifa_hora"
            name="tarifa_hora"
            type="number"
            step="0.01"
            min="0.01"
            value={form.tarifa_hora}
            onChange={onChange}
            placeholder="Ej: 5.50"
            className={`emp-form__input${errors.tarifa_hora ? ' emp-form__input--error' : ''}`}
          />
          {errors.tarifa_hora && <span className="emp-form__error">{errors.tarifa_hora}</span>}
        </div>

        {/* ── Submit ── */}
        <button type="submit" disabled={enviando} className="emp-form__submit">
          {enviando ? '⏳ Registrando…' : '✚ Registrar Empleado'}
        </button>
      </form>
    </div>
  );
}
