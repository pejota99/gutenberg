/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import {
	MenuGroup,
	MenuItemsChoice,
	PanelBody,
	SelectControl,
	ToolbarDropdownMenu,
	ToolbarGroup,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

const ALLOWED_BLOCKS = [ 'core/navigation' ];

function NavigationAreaBlock( { attributes, setAttributes } ) {
	const { area } = attributes;

	const navigationAreas = useSelect( ( select ) =>
		select( coreStore ).getEntityRecords( 'root', 'navigationArea' )
	);
	const currentNavigationMenuId = navigationAreas?.length
		? navigationAreas[ area ]
		: undefined;

	const choices = useMemo(
		() =>
			navigationAreas?.map( ( { name, description } ) => ( {
				label: description,
				value: name,
			} ) ),
		[ navigationAreas ]
	);

	const template = useMemo(
		() => [
			[
				'core/navigation',
				{ navigationMenuId: currentNavigationMenuId },
			],
		],
		[ currentNavigationMenuId ]
	);

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		orientation: 'horizontal',
		renderAppender: false,
		template,
		// templateLock: "insert",
		allowedBlocks: ALLOWED_BLOCKS,
	} );
	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarDropdownMenu
						label={ __( 'Select Area' ) }
						text={ __( 'Select Area' ) }
						icon={ null }
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<MenuItemsChoice
									value={ area }
									onSelect={ ( selectedArea ) => {
										setAttributes( { area: selectedArea } );
										onClose();
									} }
									choices={ choices }
								/>
							</MenuGroup>
						) }
					</ToolbarDropdownMenu>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Options' ) }>
					<SelectControl
						label={ _x( 'Area' ) }
						value={ area }
						// `undefined` is required for the preload attribute to be unset.
						onChange={ ( value ) =>
							setAttributes( {
								area: value,
							} )
						}
						options={ choices }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default NavigationAreaBlock;
