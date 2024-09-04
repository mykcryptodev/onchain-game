export type NftsByWalletResponse = {
  next_cursor: string | null;
  next: string | null;
  previous: string | null;
  nfts: NFT[];
}

export type NFT = {
  nft_id: string;
  chain: string;
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  previews: Previews;
  image_url: string;
  image_properties: ImageProperties;
  video_url: string | null;
  audio_url: string | null;
  model_url: string | null;
  other_url: string | null;
  background_color: string | null;
  external_url: string | null;
  created_date: string;
  status: string;
  token_count: number;
  owner_count: number;
  owners: Owner[];
  contract: Contract;
  collection: Collection;
  last_sale: Sale;
  primary_sale: Sale;
  first_created: FirstCreated;
  rarity: Rarity;
  royalty: Royalty[];
  extra_metadata: ExtraMetadata;
}

interface Previews {
  image_small_url: string;
  image_medium_url: string;
  image_large_url: string;
  image_opengraph_url: string;
  blurhash: string;
  predominant_color: string;
}

interface ImageProperties {
  width: number;
  height: number;
  size: number;
  mime_type: string;
}

interface Owner {
  owner_address: string;
  quantity: number;
  quantity_string: string;
  first_acquired_date: string;
  last_acquired_date: string;
}

interface Contract {
  type: string;
  name: string;
  symbol: string;
  deployed_by: string;
  deployed_via_contract: string | null;
  owned_by: string;
  has_multiple_collections: boolean;
}

interface Collection {
  collection_id: string;
  name: string;
  description: string;
  image_url: string;
  image_properties: ImageProperties;
  banner_image_url: string | null;
  category: string;
  is_nsfw: boolean;
  external_url: string;
  twitter_username: string;
  discord_url: string | null;
  instagram_username: string | null;
  medium_username: string | null;
  telegram_url: string | null;
  marketplace_pages: MarketplacePage[];
  metaplex_mint: string | null;
  metaplex_candy_machine: string | null;
  metaplex_first_verified_creator: string | null;
  floor_prices: FloorPrice[];
  top_bids: TopBid[];
  distinct_owner_count: number;
  distinct_nft_count: number;
  total_quantity: number;
  chains: string[];
  top_contracts: string[];
  collection_royalties: CollectionRoyalty[];
}

interface MarketplacePage {
  marketplace_id: string;
  marketplace_name: string;
  marketplace_collection_id: string;
  nft_url: string;
  collection_url: string;
  verified: boolean | null;
}

interface FloorPrice {
  marketplace_id: string;
  marketplace_name: string;
  value: number;
  payment_token: PaymentToken;
  value_usd_cents: number;
}

interface TopBid {
  marketplace_id: string;
  marketplace_name: string;
  value: number;
  payment_token: PaymentToken;
  value_usd_cents: number;
}

interface PaymentToken {
  payment_token_id: string;
  name: string;
  symbol: string;
  address: string | null;
  decimals: number;
}

interface CollectionRoyalty {
  source: string;
  total_creator_fee_basis_points: number;
  recipients: Recipient[];
}

interface Recipient {
  address: string;
  percentage: number;
  basis_points: number;
}

interface Sale {
  from_address: string | null;
  to_address: string;
  quantity: number;
  quantity_string: string;
  timestamp: string;
  transaction: string;
  marketplace_id: string;
  marketplace_name: string;
  is_bundle_sale: boolean;
  payment_token: PaymentToken;
  unit_price: number;
  total_price: number;
  unit_price_usd_cents: number;
}

interface FirstCreated {
  minted_to: string;
  quantity: number;
  quantity_string: string;
  timestamp: string;
  block_number: number;
  transaction: string;
  transaction_initiator: string;
}

interface Rarity {
  rank: number;
  score: number;
  unique_attributes: number;
}

interface Royalty {
  source: string;
  total_creator_fee_basis_points: number;
  recipients: Recipient[];
}

interface ExtraMetadata {
  attributes: Attribute[];
  image_original_url: string;
  animation_original_url: string | null;
  metadata_original_url: string;
}

interface Attribute {
  trait_type: string;
  value: string;
  display_type: string | null;
}
