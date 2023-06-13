import React from 'react'
import {API} from '@stoplight/elements'
import openapi from '../content/openapi.json'
import '@stoplight/elements/styles.min.css';

export default function APISpecifications() {
  return (
    <API apiDescriptionDocument={openapi} basePath={'/api'}/>
  )
}
