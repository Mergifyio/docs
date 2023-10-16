import {visit} from 'unist-util-visit'
import {toString} from 'mdast-util-to-string'
import configSchema from './static/mergify-configuration-openapi.json' assert {
  type: "json",
}

export function remarkHeadingsPlugin() {
  return async function transformer(tree, file) {
    let headings = []

    visit(tree, `heading`, heading => {
      headings.push({
        value: toString(heading),
        depth: heading.depth,
      })
    })

    const mdxFile = file
    if (!mdxFile.data.meta) {
      mdxFile.data.meta = {}
    }

    mdxFile.data.meta.headings = headings
  }
}

export function remarkTablePlugin() {
  return async function transformer(tree, file) {
    const tables = []
    visit(tree, 'mdxJsxFlowElement', element => {
      switch(element.name) {
        case 'OptionsTable':
          const name = element.attributes.find(attr => attr.type === 'mdxJsxAttribute' && attr.name === 'name').value
          const optionsTableData = configSchema?.definitions?.[name]?.properties
          
          tables.push({
            node: JSON.stringify(element),
            data: JSON.stringify(optionsTableData),
            content: null
          })
          break;

        case 'PullRequestAttributesTable':
          const pullRequestAttributes = configSchema?.definitions?.PullRequestAttribute?.enum
          
          tables.push({
            node: JSON.stringify(element),
            data: JSON.stringify(pullRequestAttributes),
            content: null
          })       
          break;
          
        case 'ActionOptionsTable':
          const action = element.attributes.find(attr => attr.type === 'mdxJsxAttribute' && attr.name === 'action').value
          const actionOptions = configSchema?.definitions?.Actions?.properties?.[action]?.properties
          
          tables.push({
            node: JSON.stringify(element),
            data: JSON.stringify(actionOptions),
            content: null
          })
          break;   
        case 'Table':
          tables.push({
            node: JSON.stringify(element),
            // For raw tables, we need the content as string
            // for algolia to search into
            content: toString(element),
            data: null
          })
          break;
      }
    })

    const mdxFile = file
    if (!mdxFile.data.meta) {
      mdxFile.data.meta = {}
    }
    mdxFile.data.meta.tables = tables
  }
}