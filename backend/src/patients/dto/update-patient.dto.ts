import { CreatePatientDto } from './create-patient.dto.js';

/** PUT is a full replacement, so every field is required, same as create. */
export class UpdatePatientDto extends CreatePatientDto {}
