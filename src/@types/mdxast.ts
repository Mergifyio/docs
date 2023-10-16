export interface BaseMdxNode {
  type: string;
  name: string;
  children: BaseMdxNode[]
  value: string;
  position: {
    start:{
      line:number,
      column:number,
      offset:number
    },
    end:{
      line:number,
      column:number,
      offset:number
    }
  }
}

export interface MdxNodeJsxElement extends BaseMdxNode {
  type: 'mdxJsxFlowElement';
  attributes: Array<{
    type: string,
    name: string,
    value: unknown
  }>
  children: BaseMdxNode[] | MdxNodeJsxElement[]
}
