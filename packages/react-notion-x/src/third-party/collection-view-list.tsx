import * as React from 'react'

import { PageBlock } from 'notion-types'
import { getBlockTitle, normalizeTitle } from 'notion-utils'

import { useNotionContext } from '../context'
import { CollectionViewProps } from '../types'
import { CollectionGroup } from './collection-group'
import { getCollectionGroups } from './collection-utils'
import { Property } from './property'

const defaultBlockIds = []

export const CollectionViewList: React.FC<CollectionViewProps> = ({
  collection,
  collectionView,
  collectionData
}) => {
  const isGroupedCollection = collectionView?.format?.collection_group_by

  if (isGroupedCollection) {
    const collectionGroups = getCollectionGroups(
      collection,
      collectionView,
      collectionData
    )

    return collectionGroups.map((group, key) => (
      <CollectionGroup key={key} {...group} collectionViewComponent={List} />
    ))
  }

  const blockIds =
    (collectionData['collection_group_results']?.blockIds ??
      collectionData.blockIds) ||
    defaultBlockIds

  return (
    <List
      blockIds={blockIds}
      collection={collection}
      collectionView={collectionView}
    />
  )
}

function List({ blockIds, collection, collectionView }) {
  const { components, recordMap, mapPageUrl } = useNotionContext()

  return (
    <div className='notion-list-collection'>
      <div className='notion-list-view'>
        <div className='notion-list-body'>
          {blockIds?.map((blockId) => {
            const block = recordMap.block[blockId]?.value as PageBlock
            if (!block) return null

            const titleSchema = collection.schema.title
            const titleData = block?.properties?.title

            const dataAttrTitle = titleData
              ? normalizeTitle(titleData[0][0])
              : ''

            return (
              <components.PageLink
                className='notion-list-item notion-page-link'
                href={mapPageUrl(block.id)}
                key={blockId}
              >
                <div
                  className='notion-list-item-title'
                  data-collection-row-title={dataAttrTitle}
                >
                  <Property
                    schema={titleSchema}
                    data={titleData}
                    block={block}
                    collection={collection}
                  />
                </div>

                <div className='notion-list-item-body'>
                  {collectionView.format?.list_properties
                    ?.filter((p) => p.visible)
                    .map((p) => {
                      const schema = collection.schema[p.property]
                      const data = block && block.properties?.[p.property]

                      if (!schema) {
                        return null
                      }

                      const dataAttrProperty = data
                        ? normalizeTitle(schema.name)
                        : 'undefined'
                      // this should check for relations and include related page name vv
                      let dataAttrValue
                      if (data) {
                        dataAttrValue = data ? normalizeTitle(data[0][0]) : ''
                        console.log('data' + JSON.stringify(data))
                        // if relation - get block title
                        const isRelation = data[0][0] === '‣'
                        if (isRelation) {
                          dataAttrValue = getBlockTitle(
                            data[0][1][0][1],
                            recordMap
                          )
                          console.log('dataAttr' + dataAttrValue)
                          // to do this should be returning the page title?! because this recordMap doesn't have the force added items
                        }
                      }
                      return (
                        <div
                          className='notion-list-item-property'
                          data-collection-item-property={dataAttrProperty}
                          data-collection-item-value={dataAttrValue}
                          key={p.property}
                        >
                          <Property
                            schema={schema}
                            data={data}
                            block={block}
                            collection={collection}
                          />
                        </div>
                      )
                    })}
                </div>
              </components.PageLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}
