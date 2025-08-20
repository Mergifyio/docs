import configSchema from '../../../public/mergify-configuration-schema.json';

import { ConfigSchema, Def } from './ConfigOptions';
import { OptionsTableBase } from './OptionsTable';

export default function ActionOptionsTable({ def }: Def) {
  const options = (configSchema as unknown as ConfigSchema).$defs[def].properties;
  return OptionsTableBase(configSchema, options);
}
