import { API } from '@stoplight/elements';
import React from 'react';

import '@stoplight/elements/styles.min.css';

import ApiSchemas from './api-schemas.json';

export default function APISpecifications() {
  return (
    <div>
      <API apiDescriptionDocument={ApiSchemas} basePath="/api" router={typeof window === 'undefined' ? 'memory' : 'history'} />
    </div>
  );
}
