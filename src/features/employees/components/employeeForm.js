import { WORK_TYPE_ONSITE, WORK_TYPE_WFH } from "../../../shared/services/validators.js";

/**
 * Generate employee create form HTML
 * @returns {string} Form HTML
 */
export function getEmployeeCreateForm() {
  return `
      <div class="form-group">
        <label for="employee-name">Name *</label>
        <input type="text" id="employee-name" name="name" required>
      </div>
      <div class="form-group">
        <label for="employee-email">Email *</label>
        <input type="email" id="employee-email" name="email" required>
      </div>
      <div class="form-group">
        <label for="employee-workType">Work Type *</label>
        <select id="employee-workType" name="workType" required>
          <option value="">Select work type</option>
          <option value="${WORK_TYPE_ONSITE}">Onsite</option>
          <option value="${WORK_TYPE_WFH}">Work From Home</option>
        </select>
      </div>
    `;
}

/**
 * Generate employee edit form HTML
 * @param {Object} employee - Employee data
 * @returns {string} Form HTML
 */
export function getEmployeeEditForm(employee) {
  if (!employee) {
    throw new Error("Employee data is required");
  }

  const name = employee.name || "";
  const email = employee.email || "";
  const workType = employee.workType || "";

  return `
      <div class="form-group">
        <label for="employee-name">Name *</label>
        <input type="text" id="employee-name" name="name" value="${name}" required>
      </div>
      <div class="form-group">
        <label for="employee-email">Email *</label>
        <input type="email" id="employee-email" name="email" value="${email}" required>
      </div>
      <div class="form-group">
        <label for="employee-workType">Work Type *</label>
        <select id="employee-workType" name="workType" required>
          <option value="">Select work type</option>
          <option value="${WORK_TYPE_ONSITE}" ${workType === WORK_TYPE_ONSITE ? "selected" : ""}>Onsite</option>
          <option value="${WORK_TYPE_WFH}" ${workType === WORK_TYPE_WFH ? "selected" : ""}>Work From Home</option>
        </select>
      </div>
    `;
}
