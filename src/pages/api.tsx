import { API } from '@stoplight/elements';
import React from 'react';

import '@stoplight/elements/styles.min.css';

export default function APISpecifications() {
  return (
    <div>
      <API apiDescriptionDocument="https://api.mergify.com/v1/openapi.json" basePath="/api" router={typeof window === 'undefined' ? 'memory' : 'history'} />
    </div>
  );
}
