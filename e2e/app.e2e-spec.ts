import { VoucherWarehouseTemplatePage } from './app.po';

describe('VoucherWarehouse App', function () {
    let page: VoucherWarehouseTemplatePage;

    beforeEach(() => {
        page = new VoucherWarehouseTemplatePage();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toEqual('app works!');
    });
});
