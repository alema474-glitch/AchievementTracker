//signin.validation.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  
    const value = control.value;

    //if (!value) {
    //  // Si el campo está vacío, dejamos que el validador muestre el error
    //  return null;
    //}

    const hasUpperCase = /[A-Z]+/.test(value);
    const hasNumeric = /[0-9]+/.test(value);

    // Si falta la mayúscula o el número, devolvemos el error
    const passwordValid = hasUpperCase && hasNumeric;

    return passwordValid ? null : { weakPassword: true };
}

//login.validator.ts
export function restrictedWordsValidator(words: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isRestricted = words.includes(control.value?.toLowerCase());
    return isRestricted ? { restrictedWord: true } : null;
  };
}

//signin.validator.ts
export function matchPasswordValidator(control: AbstractControl): ValidationErrors | null {
    
  // 1. Obtenemos el valor del campo campo "confirmPassword" (que es el 'control' actual)
    const confirmValue = control.value;

    // 2. Subimos al padre (el FormGroup) para buscar el otro campo
    // Es importante verificar si existe el parent para evitar errores al inicio
    const formGroup = control.parent; 
    
    if (!formGroup) {
      return null; // Aún no está listo el formulario
    }

    const passwordControl = formGroup.get('password'); // Buscamos al hermano
    const passwordValue = passwordControl?.value;

    // 3. Comparamos
    if (!passwordValue || !confirmValue) {
        return null; // Dejamos que el 'required' haga su trabajo si están vacíos
    }

    return passwordValue === confirmValue ? null : { mismatch: true };
}