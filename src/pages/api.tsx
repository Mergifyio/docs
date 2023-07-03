import { API } from '@stoplight/elements';
import React, { useEffect, useState } from 'react';

import '@stoplight/elements/styles.min.css';

async function getOpenapiDocument(): Promise<string> {
  try {
    const response = await window.fetch('https://api.mergify.com/v1/openapi.json');

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch openapi.json.');
  }

  return '';
}

export default function APISpecifications() {
  const [openapiDocument, setOpenapiDocument] = useState<string | null>(null);

  useEffect(() => {
    getOpenapiDocument().then((doc) => {
      setOpenapiDocument(doc);
    });
  }, []);

  return (
    <div>
      {!!openapiDocument && <API apiDescriptionDocument={openapiDocument} basePath="/api" router={typeof window === 'undefined' ? 'memory' : 'history'} />}
    </div>
  );
}
