import type { AnyOrama, Results, SearchParams, Nullable } from '@orama/orama'
import { search } from '@orama/orama'
import { OramaClient, ClientSearchParams } from '@oramacloud/client'

type OramaSwitchClient = AnyOrama | OramaClient

type ClientType = 'oss' | 'cloud'

export class Switch<T = OramaSwitchClient> {
  client: OramaSwitchClient
  clientType: ClientType
  isCloud: boolean = false
  isOSS: boolean = false
  
  constructor(client: OramaSwitchClient) {
    this.client = client

    if (client instanceof OramaClient) {
      this.clientType = 'cloud'
      this.isCloud = true
    } else if (typeof client === 'object' && 'id' in client && 'tokenizer' in client) {
      this.clientType = 'oss'
      this.isOSS = true
    } else {
      throw new Error('Invalid client. Expected either an OramaClient or an Orama OSS database.')
    }
  }

  async search<R = unknown>(params: T extends OramaClient ? ClientSearchParams : SearchParams<AnyOrama>): Promise<Nullable<Results<R>>> {
    if (this.isCloud) {
      return (this.client as OramaClient).search(params as T extends OramaClient ? ClientSearchParams : never)
    } else {
      return search(this.client as AnyOrama, params as SearchParams<AnyOrama>) as Promise<Nullable<Results<R>>>
    }
  }
}
