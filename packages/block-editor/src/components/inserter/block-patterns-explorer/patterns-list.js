/**
 * WordPress dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useDebounce, useAsyncList } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../../block-patterns-list';
import InserterNoResults from '../no-results';
import useInsertionPoint from '../hooks/use-insertion-point';
import usePatternsState from '../hooks/use-patterns-state';
import InserterListbox from '../../inserter-listbox';
import { searchItems } from '../search-items';

const INITIAL_INSERTER_RESULTS = 2;

function PatternsListHeader( { filterValue, filteredBlockPatternsLength } ) {
	if ( ! filterValue ) {
		return null;
	}
	return (
		<h2 className="block-editor-block-patterns-explorer__search-results-count">
			{ sprintf(
				/* translators: %d: number of patterns. %s: block pattern search query */
				_n(
					'%1$d pattern found for "%2$s"',
					'%1$d patterns found for "%2$s"',
					filteredBlockPatternsLength
				),
				filteredBlockPatternsLength,
				filterValue
			) }
		</h2>
	);
}

function PatternList( {
	filterValue,
	selectedCategory,
	patternCategories,
	maxSearchResults,
} ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		shouldFocusBlock: true,
	} );
	const [ allPatterns, , onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);
	const registeredPatternCategories = useMemo(
		() =>
			patternCategories.map(
				( patternCategory ) => patternCategory.name
			),
		[ patternCategories ]
	);

	const filteredBlockPatterns = useMemo( () => {
		if ( ! filterValue ) {
			return allPatterns.filter( ( pattern ) =>
				selectedCategory === 'uncategorized'
					? ! pattern.categories?.length ||
					  pattern.categories.every(
							( category ) =>
								! registeredPatternCategories.includes(
									category
								)
					  )
					: pattern.categories?.includes( selectedCategory )
			);
		}
		const results = searchItems( allPatterns, filterValue );
		return maxSearchResults !== undefined
			? results.slice( 0, maxSearchResults )
			: results;
	}, [ filterValue, selectedCategory, allPatterns, maxSearchResults ] );

	// Announce search results on change.
	useEffect( () => {
		if ( ! filterValue ) {
			return;
		}
		const count = filteredBlockPatterns.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	const currentShownPatterns = useAsyncList( filteredBlockPatterns, {
		step: INITIAL_INSERTER_RESULTS,
	} );

	const hasItems = !! filteredBlockPatterns?.length;
	return (
		<div>
			{ hasItems && (
				<PatternsListHeader
					filterValue={ filterValue }
					filteredBlockPatternsLength={ filteredBlockPatterns.length }
				/>
			) }
			<InserterListbox>
				{ ! hasItems && <InserterNoResults /> }
				{ hasItems && (
					<BlockPatternsList
						shownPatterns={ currentShownPatterns }
						blockPatterns={ filteredBlockPatterns }
						onClickPattern={ onSelectBlockPattern }
						isDraggable={ false }
					/>
				) }
			</InserterListbox>
		</div>
	);
}

export default PatternList;
