/**
 * External dependencies
 */
import { upperFirst, camelCase, map, find, get, startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { addEntities } from './actions';

export const DEFAULT_ENTITY_KEY = 'id';

const POST_RAW_ATTRIBUTES = [ 'title', 'excerpt', 'content' ];

export const defaultEntities = [
	{
		label: __( 'Base' ),
		name: '__unstableBase',
		kind: 'root',
		baseURL: '/',
	},
	{
		label: __( 'Site' ),
		name: 'site',
		kind: 'root',
		baseURL: '/wp/v2/settings',
		getTitle: ( record ) => {
			return get( record, [ 'title' ], __( 'Site Title' ) );
		},
	},
	{
		label: __( 'Post Type' ),
		name: 'postType',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/types',
		baseURLParams: { context: 'edit' },
		rawAttributes: POST_RAW_ATTRIBUTES,
	},
	{
		name: 'media',
		kind: 'root',
		baseURL: '/wp/v2/media',
		baseURLParams: { context: 'edit' },
		plural: 'mediaItems',
		label: __( 'Media' ),
	},
	{
		name: 'taxonomy',
		kind: 'root',
		key: 'slug',
		baseURL: '/wp/v2/taxonomies',
		baseURLParams: { context: 'edit' },
		plural: 'taxonomies',
		label: __( 'Taxonomy' ),
	},
	{
		name: 'sidebar',
		kind: 'root',
		baseURL: '/wp/v2/sidebars',
		plural: 'sidebars',
		transientEdits: { blocks: true },
		label: __( 'Widget areas' ),
	},
	{
		name: 'widget',
		kind: 'root',
		baseURL: '/wp/v2/widgets',
		baseURLParams: { context: 'edit' },
		plural: 'widgets',
		transientEdits: { blocks: true },
		label: __( 'Widgets' ),
	},
	{
		name: 'widgetType',
		kind: 'root',
		baseURL: '/wp/v2/widget-types',
		baseURLParams: { context: 'edit' },
		plural: 'widgetTypes',
		label: __( 'Widget types' ),
	},
	{
		label: __( 'User' ),
		name: 'user',
		kind: 'root',
		baseURL: '/wp/v2/users',
		baseURLParams: { context: 'edit' },
		plural: 'users',
	},
	{
		name: 'comment',
		kind: 'root',
		baseURL: '/wp/v2/comments',
		baseURLParams: { context: 'edit' },
		plural: 'comments',
		label: __( 'Comment' ),
	},
	{
		name: 'menu',
		kind: 'root',
		baseURL: '/__experimental/menus',
		baseURLParams: { context: 'edit' },
		plural: 'menus',
		label: __( 'Menu' ),
	},
	{
		name: 'menuItem',
		kind: 'root',
		baseURL: '/__experimental/menu-items',
		baseURLParams: { context: 'edit' },
		plural: 'menuItems',
		label: __( 'Menu Item' ),
		rawAttributes: [ 'title', 'content' ],
	},
	{
		name: 'menuLocation',
		kind: 'root',
		baseURL: '/__experimental/menu-locations',
		baseURLParams: { context: 'edit' },
		plural: 'menuLocations',
		label: __( 'Menu Location' ),
		key: 'name',
	},
	{
		label: __( 'Global Styles' ),
		name: 'globalStyles',
		kind: 'root',
		baseURL: '/wp/v2/global-styles',
		baseURLParams: { context: 'edit' },
		plural: 'globalStylesVariations', // should be different than name
		getTitle: ( record ) => record?.title?.rendered || record?.title,
	},
	{
		label: __( 'Themes' ),
		name: 'theme',
		kind: 'root',
		baseURL: '/wp/v2/themes',
		baseURLParams: { context: 'edit' },
		key: 'stylesheet',
	},
];

export const kinds = [
	{ name: 'postType', loadEntities: loadPostTypeEntities },
	{ name: 'taxonomy', loadEntities: loadTaxonomyEntities },
];

/**
 * Returns a function to be used to retrieve extra edits to apply before persisting a post type.
 *
 * @param {Object} persistedRecord Already persisted Post
 * @param {Object} edits           Edits.
 * @return {Object} Updated edits.
 */
export const prePersistPostType = ( persistedRecord, edits ) => {
	const newEdits = {};

	if ( persistedRecord?.status === 'auto-draft' ) {
		// Saving an auto-draft should create a draft by default.
		if ( ! edits.status && ! newEdits.status ) {
			newEdits.status = 'draft';
		}

		// Fix the auto-draft default title.
		if (
			( ! edits.title || edits.title === 'Auto Draft' ) &&
			! newEdits.title &&
			( ! persistedRecord?.title ||
				persistedRecord?.title === 'Auto Draft' )
		) {
			newEdits.title = '';
		}
	}

	return newEdits;
};

/**
 * Returns the list of post type entities.
 *
 * @return {Promise} Entities promise
 */
async function loadPostTypeEntities() {
	const postTypes = await apiFetch( { path: '/wp/v2/types?context=edit' } );
	return map( postTypes, ( postType, name ) => {
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			name
		);
		return {
			kind: 'postType',
			baseURL: '/wp/v2/' + postType.rest_base,
			baseURLParams: { context: 'edit' },
			name,
			label: postType.labels.singular_name,
			transientEdits: {
				blocks: true,
				selection: true,
			},
			mergedEdits: { meta: true },
			rawAttributes: POST_RAW_ATTRIBUTES,
			getTitle: ( record ) =>
				record?.title?.rendered ||
				record?.title ||
				( isTemplate ? startCase( record.slug ) : String( record.id ) ),
			__unstablePrePersist: isTemplate ? undefined : prePersistPostType,
			__unstable_rest_base: postType.rest_base,
		};
	} );
}

/**
 * Returns the list of the taxonomies entities.
 *
 * @return {Promise} Entities promise
 */
async function loadTaxonomyEntities() {
	const taxonomies = await apiFetch( {
		path: '/wp/v2/taxonomies?context=edit',
	} );
	return map( taxonomies, ( taxonomy, name ) => {
		return {
			kind: 'taxonomy',
			baseURL: '/wp/v2/' + taxonomy.rest_base,
			baseURLParams: { context: 'edit' },
			name,
			label: taxonomy.labels.singular_name,
		};
	} );
}

/**
 * Returns the entity's getter method name given its kind and name.
 *
 * @param {string}  kind      Entity kind.
 * @param {string}  name      Entity name.
 * @param {string}  prefix    Function prefix.
 * @param {boolean} usePlural Whether to use the plural form or not.
 *
 * @return {string} Method name
 */
export const getMethodName = (
	kind,
	name,
	prefix = 'get',
	usePlural = false
) => {
	const entity = find( defaultEntities, { kind, name } );
	const kindPrefix = kind === 'root' ? '' : upperFirst( camelCase( kind ) );
	const nameSuffix =
		upperFirst( camelCase( name ) ) + ( usePlural ? 's' : '' );
	const suffix =
		usePlural && entity.plural
			? upperFirst( camelCase( entity.plural ) )
			: nameSuffix;
	return `${ prefix }${ kindPrefix }${ suffix }`;
};

/**
 * Loads the kind entities into the store.
 *
 * @param {string} kind Kind
 *
 * @return {Array} Entities
 */
export const getKindEntities = ( kind ) => async ( { select, dispatch } ) => {
	let entities = select.getEntitiesByKind( kind );
	if ( entities && entities.length !== 0 ) {
		return entities;
	}

	const kindConfig = find( kinds, { name: kind } );
	if ( ! kindConfig ) {
		return [];
	}

	entities = await kindConfig.loadEntities();
	dispatch( addEntities( entities ) );

	return entities;
};
