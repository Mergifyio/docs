import { API } from '@stoplight/elements';
import React from 'react';

import '@stoplight/elements/styles.min.css';
import './dark-mode-override.css';
import ApiSchemas from './api-schemas.json';

export default function APISpecifications() {
  return (
    <div id="api-reference">
      <API apiDescriptionDocument={ApiSchemas} basePath="/api" router={typeof window === 'undefined' ? 'memory' : 'history'} />
    </div>
  );
}
