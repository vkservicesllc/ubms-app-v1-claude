import createForm, { constructForm } from './builder.mjs';
import {
  emptyOpt,
  createIdForm,
  createPersonNameForm,
  createGenderForm,
  createPhoneForm,
  createEmailForm,
} from './reusable.mjs';

import User from '../core/user.mjs';
import selector from '../../../client/global/modules/registry/selectors/user.mjs';
import roleSelector from '../../../client/global/modules/registry/selectors/user-role.mjs';
import length from '../../../client/global/modules/registry/length.mjs';
import { getStaticProps } from '../../../client/global/modules/tools/utils/class.mjs';
import { capitalizeFirst } from '../../../client/global/modules/tools/utils/string.mjs';
import { validate } from './validator.mjs';

const required = true,
  disabled = true;
const statusList = { ...User.list.status };
delete statusList['D'];

const propsData = {
  status: statusList,
  location: User.list.location,
  condition: User.list.condition,
};

const conditionKeys = ['active', 'inactive', 'locked'];

const createPropsForm = (flag, props = {}) =>
  createForm({
    selector,
    target: flag,
    group: flag,
    data: propsData[flag],
    ...props,
    type: flag === 'condition' ? 'select/radio' : 'select',
    name: flag,
    emptyOpt: flag !== 'condition' ? emptyOpt : null,
    keys: flag === 'condition' ? conditionKeys : null,
    required,
    label: capitalizeFirst(flag),
  });

const createUsernameForm = (flag) =>
  createForm({
    selector,
    target: flag === 'new' ? 'newUsername' : 'username',
    group: flag === 'new' ? 'signUp' : 'signIn',
    name: 'username',
    maxLength: length.user.username.max,
    autoComplete: 'off',
    required,
    disabled,
    label: flag === 'new' ? 'Create Username' : 'Username',
    validator:
      flag === 'new'
        ? {
            length: { min: length.user.username.min },
          }
        : true,
  });

const createPasswordForm = (flag) => {
  let target = 'password',
    name = 'password',
    autoComplete = 'new-password',
    label = 'Password',
    validator = true;

  switch (flag) {
    case 'new':
      target = 'createPassword';
      label = 'Create Password';
      name = 'newPassword';
      validator = {
        length: { min: length.user.password.min },
        //! add more...
      };
      break;

    case 'confirm':
      target = 'confirmPassword';
      name = null;
      label = 'Confirm Password';
      break;

    default:
      autoComplete = 'off';
  }

  return createForm({
    selector,
    target,
    group: flag === 'new' ? 'signUp' : 'signIn',
    type: 'password',
    name,
    maxLength: length.user.password.max,
    autoComplete,
    required,
    disabled,
    label,
    validator,
  });
};

const createRoleNameForm = (target) =>
  createForm({
    selector: roleSelector,
    target,
    group: 'roleName',
    name: 'name',
    maxLength: length.user.roleName.max,
    required,
    label: 'Role Name',
    validator: {
      sanitizer: (value) => value.replace('&amp;', '&').replace('&#x27;', "'"),
    },
  });

const createRoleLocationForm = (target) => {
  const props = {
    selector: roleSelector,
    target,
    group: 'roleLocation',
    type: 'select',
    name: 'location',
    data: propsData.location,
    emptyOpt: 'All',
    label: 'Location',
    validator: {
      sanitizer: (value) => value || null,
    },
  };
  // if (target !== 'roleLocation') props.validator = false

  return createForm(props);
};

class UserForm {
  constructor(options = {}) {
    getStaticProps(UserForm).forEach(
      (target) => (this[target] = constructForm(UserForm, target, options)),
    );
  }

  static id = createIdForm({ selector });
  static modifyId = createIdForm({ selector, target: 'modifyId' });
  static deleteId = createIdForm({ selector, target: 'deleteId' });
  static resetId = createIdForm({ selector, target: 'resetId' });

  static hiddenUsername = createForm({
    selector,
    target: 'username',
    type: 'hidden',
  });

  static hiddenEmail = createForm({
    selector,
    target: 'email',
    type: 'hidden',
  });

  static status = createPropsForm('status');
  static location = createPropsForm('location');
  static condition = createPropsForm('condition', {
    validator: {
      sanitizer: (value) => (value === 'L' ? 'I' : value),
    },
  });

  static unscoped = createForm({
    selector,
    target: 'unscoped',
    type: 'checkbox',
    name: 'unscoped',
    label: 'Unscoped',
    validator: {
      sanitizer: (value) => value === 'on' || value === 'true',
    },
  });

  static username = createUsernameForm();
  static newUsername = createUsernameForm('new');

  static password = createPasswordForm();
  static createPassword = createPasswordForm('new');
  static confirmPassword = createPasswordForm('confirm');

  static token = createForm({
    selector,
    target: 'token',
    name: 'token',
    maxLength: length.user.token.max,
    contextMenu: true,
    required,
    label: 'Token',
    validator: {
      rule: 'numeric',
      length: { min: length.user.token.min },
    },
  });

  static firstName = createPersonNameForm('first', {
    selector,
    group: 'name',
    label: 'Real First Name',
  });
  static lastName = createPersonNameForm('last', { selector, group: 'name' });
  static alias = createPersonNameForm('alias', { selector, group: 'name' });
  static gender = createGenderForm({ selector, required: false });

  static email = createEmailForm({ selector, required });
  static phone = createPhoneForm({ selector, label: 'US Cell Phone' });

  static validate = () =>
    validate(UserForm, () => [
      'status',
      'location',
      'email',
      'phone',
      'firstName',
      'lastName',
      'alias',
      'gender',
    ]);
}

class RoleForm {
  constructor(options = {}) {
    getStaticProps(RoleForm).forEach(
      (target) => (this[target] = constructForm(RoleForm, target, options)),
    );
  }

  static roleId = createIdForm({ selector: roleSelector, target: 'roleId' });
  static roleDeleteId = createIdForm({ selector: roleSelector, target: 'roleDeleteId' });
  static carrierRoleId = createIdForm({ selector: roleSelector, target: 'carrierRoleId' });
  static carrierRoleDeleteId = createIdForm({
    selector: roleSelector,
    target: 'carrierRoleDeleteId',
  });

  static roleName = createRoleNameForm('roleName');
  static carrierRoleName = createRoleNameForm('carrierRoleName');

  static roleLocation = createRoleLocationForm('roleLocation');
  static carrierRoleLocation = createRoleLocationForm('carrierRoleLocation');

  static validate = () => validate(RoleForm, () => ['roleName', 'roleLocation']);
}

export default UserForm;
export { RoleForm };
