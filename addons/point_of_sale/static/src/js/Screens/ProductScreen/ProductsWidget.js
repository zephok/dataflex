odoo.define('point_of_sale.ProductsWidget', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const { useListener } = require("@web/core/utils/hooks");
    const Registries = require('point_of_sale.Registries');

    const { onWillUnmount, useState } = owl;

    class ProductsWidget extends PosComponent {
        /**
         * @param {Object} props
         * @param {number?} props.startCategoryId
         */
        setup() {
            super.setup();
            useListener('switch-category', this._switchCategory);
            useListener('update-search', this._updateSearch);
            useListener('try-add-product', this._tryAddProduct);
            useListener('clear-search', this._clearSearch);
            useListener('update-product-list', this._updateProductList);
            this.state = useState({ searchWord: '' });
            onWillUnmount(this.onWillUnmount);
        }
        onWillUnmount() {
            this.trigger('toggle-mobile-searchbar', false);
        }
        get selectedCategoryId() {
            return this.env.pos.selectedCategoryId;
        }
        get searchWord() {
            return this.state.searchWord.trim();
        }
        get productsToDisplay() {
            let list = [];
            if (this.searchWord !== '') {
                list = this.env.pos.db.search_product_in_category(
                    this.selectedCategoryId,
                    this.searchWord
                );
            } else {
                list = this.env.pos.db.get_product_by_category(this.selectedCategoryId);
            }
            return list.sort(function (a, b) { return a.display_name.localeCompare(b.display_name) });
        }
        get subcategories() {
            return this.env.pos.db
                .get_category_childs_ids(this.selectedCategoryId)
                .map(id => this.env.pos.db.get_category_by_id(id));
        }
        get breadcrumbs() {
            if (this.selectedCategoryId === this.env.pos.db.root_category_id) return [];
            return [
                ...this.env.pos.db
                    .get_category_ancestors_ids(this.selectedCategoryId)
                    .slice(1),
                this.selectedCategoryId,
            ].map(id => this.env.pos.db.get_category_by_id(id));
        }
        get hasNoCategories() {
            return this.env.pos.db.get_category_childs_ids(0).length === 0;
        }
        _switchCategory(event) {
            this.env.pos.setSelectedCategoryId(event.detail);
        }
        _updateSearch(event) {
            this.state.searchWord = event.detail;
        }
        _tryAddProduct(event) {
            const searchResults = this.productsToDisplay;
            // If the search result contains one item, add the product and clear the search.
            if (searchResults.length === 1) {
                const { searchWordInput } = event.detail;
                this.trigger('click-product', searchResults[0]);
                // the value of the input element is not linked to the searchWord state,
                // so we clear both the state and the element's value.
                searchWordInput.el.value = '';
                this._clearSearch();
            }
        }
        _clearSearch() {
            this.state.searchWord = '';
        }
        _updateProductList(event) {
            this.render(true);
            this.trigger('switch-category', 0);
        }
    }
    ProductsWidget.template = 'ProductsWidget';

    Registries.Component.add(ProductsWidget);

    return ProductsWidget;
});
