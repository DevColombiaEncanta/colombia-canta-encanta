import { forwardRef } from 'react';

// forwardRef: aditivo, no cambia nada para los ~15 usos ya existentes que no
// pasan `ref` — hace falta para ConfirmDialog, que necesita enfocar el botón
// "Cancelar" al abrirse (ver hallazgo de accesibilidad en ConfirmDialog.jsx).
const Button = forwardRef(function Button({ variant = 'primario', className = '', ...props }, ref) {
  return <button ref={ref} className={`admin-btn admin-btn-${variant} ${className}`.trim()} {...props} />;
});

export default Button;
