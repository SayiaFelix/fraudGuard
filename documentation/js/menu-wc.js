'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">nobleui-angular documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AdvancedFormElementsModule.html" data-type="entity-link" >AdvancedFormElementsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AdvancedFormElementsModule-e7888ad9daf3ae8f73a34ff68f2ae4b0539bce9029e77c01bbd9f48e429e2b3faf2da073da5e9111e6f4c010e6c27c21d1e756d9ba2cf8513f45b617ffd0d4d5"' : 'data-bs-target="#xs-components-links-module-AdvancedFormElementsModule-e7888ad9daf3ae8f73a34ff68f2ae4b0539bce9029e77c01bbd9f48e429e2b3faf2da073da5e9111e6f4c010e6c27c21d1e756d9ba2cf8513f45b617ffd0d4d5"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AdvancedFormElementsModule-e7888ad9daf3ae8f73a34ff68f2ae4b0539bce9029e77c01bbd9f48e429e2b3faf2da073da5e9111e6f4c010e6c27c21d1e756d9ba2cf8513f45b617ffd0d4d5"' :
                                            'id="xs-components-links-module-AdvancedFormElementsModule-e7888ad9daf3ae8f73a34ff68f2ae4b0539bce9029e77c01bbd9f48e429e2b3faf2da073da5e9111e6f4c010e6c27c21d1e756d9ba2cf8513f45b617ffd0d4d5"' }>
                                            <li class="link">
                                                <a href="components/AdvancedFormElementsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdvancedFormElementsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FormValidationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FormValidationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InputMaskComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InputMaskComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NgSelectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NgSelectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NgxChipsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NgxChipsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NgxColorPickerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NgxColorPickerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NgxDropzoneWrapperComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NgxDropzoneWrapperComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AdvancedUiModule.html" data-type="entity-link" >AdvancedUiModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AdvancedUiModule-2f5b7406d091102a51784987e96def4c5a8deff35233091c15bc158624be1cfb308a55fc1d06c69e77e3d41120c89cb749d66071f128a5b7405f745b47314ba2"' : 'data-bs-target="#xs-components-links-module-AdvancedUiModule-2f5b7406d091102a51784987e96def4c5a8deff35233091c15bc158624be1cfb308a55fc1d06c69e77e3d41120c89cb749d66071f128a5b7405f745b47314ba2"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AdvancedUiModule-2f5b7406d091102a51784987e96def4c5a8deff35233091c15bc158624be1cfb308a55fc1d06c69e77e3d41120c89cb749d66071f128a5b7405f745b47314ba2"' :
                                            'id="xs-components-links-module-AdvancedUiModule-2f5b7406d091102a51784987e96def4c5a8deff35233091c15bc158624be1cfb308a55fc1d06c69e77e3d41120c89cb749d66071f128a5b7405f745b47314ba2"' }>
                                            <li class="link">
                                                <a href="components/AdvancedUiComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdvancedUiComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ImageCropperComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ImageCropperComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/OwlCarouselComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OwlCarouselComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SortablejsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SortablejsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SweetAlertComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SweetAlertComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-0f786678fe44787a4a08da380a6f1179c91b601a779dd694320045702f8f8cc956db67a925f7a5eb7880d519144d2b9e00b7a448a0fa28cbb45dbac9c1d78693"' : 'data-bs-target="#xs-components-links-module-AppModule-0f786678fe44787a4a08da380a6f1179c91b601a779dd694320045702f8f8cc956db67a925f7a5eb7880d519144d2b9e00b7a448a0fa28cbb45dbac9c1d78693"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-0f786678fe44787a4a08da380a6f1179c91b601a779dd694320045702f8f8cc956db67a925f7a5eb7880d519144d2b9e00b7a448a0fa28cbb45dbac9c1d78693"' :
                                            'id="xs-components-links-module-AppModule-0f786678fe44787a4a08da380a6f1179c91b601a779dd694320045702f8f8cc956db67a925f7a5eb7880d519144d2b9e00b7a448a0fa28cbb45dbac9c1d78693"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ErrorPageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ErrorPageComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppsModule.html" data-type="entity-link" >AppsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppsModule-1fe73921ee105bbf8cba71fcfd9ac2b028eff23cef509bb0ec9ab63120cd7c0d899bef983ac288b1a048616f0ea38929b2005584d93691880ff8771012152056"' : 'data-bs-target="#xs-components-links-module-AppsModule-1fe73921ee105bbf8cba71fcfd9ac2b028eff23cef509bb0ec9ab63120cd7c0d899bef983ac288b1a048616f0ea38929b2005584d93691880ff8771012152056"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppsModule-1fe73921ee105bbf8cba71fcfd9ac2b028eff23cef509bb0ec9ab63120cd7c0d899bef983ac288b1a048616f0ea38929b2005584d93691880ff8771012152056"' :
                                            'id="xs-components-links-module-AppsModule-1fe73921ee105bbf8cba71fcfd9ac2b028eff23cef509bb0ec9ab63120cd7c0d899bef983ac288b1a048616f0ea38929b2005584d93691880ff8771012152056"' }>
                                            <li class="link">
                                                <a href="components/AppsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CalendarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CalendarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChatComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChatComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ComposeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ComposeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EmailComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InboxComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InboxComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ReadComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReadComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AuthModule-673879a622a07a9573e9a7d52f3d2a5d6de6e6d4ed3ba752a49b22925c0d8b10108568e38f6d3cb1d53d2fe0475dba5dcda25ceb69c53c726bab8d4a0033b1f7"' : 'data-bs-target="#xs-components-links-module-AuthModule-673879a622a07a9573e9a7d52f3d2a5d6de6e6d4ed3ba752a49b22925c0d8b10108568e38f6d3cb1d53d2fe0475dba5dcda25ceb69c53c726bab8d4a0033b1f7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AuthModule-673879a622a07a9573e9a7d52f3d2a5d6de6e6d4ed3ba752a49b22925c0d8b10108568e38f6d3cb1d53d2fe0475dba5dcda25ceb69c53c726bab8d4a0033b1f7"' :
                                            'id="xs-components-links-module-AuthModule-673879a622a07a9573e9a7d52f3d2a5d6de6e6d4ed3ba752a49b22925c0d8b10108568e38f6d3cb1d53d2fe0475dba5dcda25ceb69c53c726bab8d4a0033b1f7"' }>
                                            <li class="link">
                                                <a href="components/AuthComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChangeAuthPasswordComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChangeAuthPasswordComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChangePasswordComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChangePasswordComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FirstTimeLoginComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FirstTimeLoginComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ForgotPasswordComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ForgotPasswordComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoginComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RegisterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RegisterComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ChartsGraphsModule.html" data-type="entity-link" >ChartsGraphsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ChartsGraphsModule-4c8bfa645f9987f1927f5f69681e8f9e187fcaa8ebe3a067aca4cfdc1609ac398d383d560c34a4920fdc80898e711f3437a3249645ba67dec7e7be382f7d19a7"' : 'data-bs-target="#xs-components-links-module-ChartsGraphsModule-4c8bfa645f9987f1927f5f69681e8f9e187fcaa8ebe3a067aca4cfdc1609ac398d383d560c34a4920fdc80898e711f3437a3249645ba67dec7e7be382f7d19a7"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ChartsGraphsModule-4c8bfa645f9987f1927f5f69681e8f9e187fcaa8ebe3a067aca4cfdc1609ac398d383d560c34a4920fdc80898e711f3437a3249645ba67dec7e7be382f7d19a7"' :
                                            'id="xs-components-links-module-ChartsGraphsModule-4c8bfa645f9987f1927f5f69681e8f9e187fcaa8ebe3a067aca4cfdc1609ac398d383d560c34a4920fdc80898e711f3437a3249645ba67dec7e7be382f7d19a7"' }>
                                            <li class="link">
                                                <a href="components/ApexchartsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ApexchartsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChartjsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChartjsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChartsGraphsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChartsGraphsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CodePreviewModule.html" data-type="entity-link" >CodePreviewModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CodePreviewModule-8c88b084863fd7dbca6409d24c7fcea040dd411ae5dbc64b2a269476dac48959392908a97a87e3bf571442563ebb527ce9bb321c6fd6cd5b0288940210c481e9"' : 'data-bs-target="#xs-components-links-module-CodePreviewModule-8c88b084863fd7dbca6409d24c7fcea040dd411ae5dbc64b2a269476dac48959392908a97a87e3bf571442563ebb527ce9bb321c6fd6cd5b0288940210c481e9"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CodePreviewModule-8c88b084863fd7dbca6409d24c7fcea040dd411ae5dbc64b2a269476dac48959392908a97a87e3bf571442563ebb527ce9bb321c6fd6cd5b0288940210c481e9"' :
                                            'id="xs-components-links-module-CodePreviewModule-8c88b084863fd7dbca6409d24c7fcea040dd411ae5dbc64b2a269476dac48959392908a97a87e3bf571442563ebb527ce9bb321c6fd6cd5b0288940210c481e9"' }>
                                            <li class="link">
                                                <a href="components/CodePreviewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CodePreviewComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CustomersModule.html" data-type="entity-link" >CustomersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-CustomersModule-8d284ded996c55eea72ea7b17665bdf33adc5050e63b07453c92b6d8cfd9b47b65edd10ecd50cc5a05bca49af966e67d916c82b9511356d82cb0875cc6627e79"' : 'data-bs-target="#xs-components-links-module-CustomersModule-8d284ded996c55eea72ea7b17665bdf33adc5050e63b07453c92b6d8cfd9b47b65edd10ecd50cc5a05bca49af966e67d916c82b9511356d82cb0875cc6627e79"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-CustomersModule-8d284ded996c55eea72ea7b17665bdf33adc5050e63b07453c92b6d8cfd9b47b65edd10ecd50cc5a05bca49af966e67d916c82b9511356d82cb0875cc6627e79"' :
                                            'id="xs-components-links-module-CustomersModule-8d284ded996c55eea72ea7b17665bdf33adc5050e63b07453c92b6d8cfd9b47b65edd10ecd50cc5a05bca49af966e67d916c82b9511356d82cb0875cc6627e79"' }>
                                            <li class="link">
                                                <a href="components/AddCustomerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddCustomerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListCustomersComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListCustomersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListFailedRegistrationsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListFailedRegistrationsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ReasonsForFailureComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReasonsForFailureComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SendSmsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SendSmsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewCustomerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewCustomerComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/CustomersRoutingModule.html" data-type="entity-link" >CustomersRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/DashboardModule.html" data-type="entity-link" >DashboardModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-DashboardModule-5b1970366b05c8ca33807db0fd7346174b5ed90a5dcd3f8c6d124965744382b82f66b6732552c7efcc29826ee2d52fd661f58795cb92ccf4055b9c9117d1b4db"' : 'data-bs-target="#xs-components-links-module-DashboardModule-5b1970366b05c8ca33807db0fd7346174b5ed90a5dcd3f8c6d124965744382b82f66b6732552c7efcc29826ee2d52fd661f58795cb92ccf4055b9c9117d1b4db"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-DashboardModule-5b1970366b05c8ca33807db0fd7346174b5ed90a5dcd3f8c6d124965744382b82f66b6732552c7efcc29826ee2d52fd661f58795cb92ccf4055b9c9117d1b4db"' :
                                            'id="xs-components-links-module-DashboardModule-5b1970366b05c8ca33807db0fd7346174b5ed90a5dcd3f8c6d124965744382b82f66b6732552c7efcc29826ee2d52fd661f58795cb92ccf4055b9c9117d1b4db"' }>
                                            <li class="link">
                                                <a href="components/DashboardComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DashboardComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/FeatherIconModule.html" data-type="entity-link" >FeatherIconModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#directives-links-module-FeatherIconModule-dc46306daa3887338c8e441cd730b58be70113ee2e69f0c84fc1dc48ec9813e28eb9a5d7be625d9d589bc8680024bec72bdce50260fd0e48113d331fae0cec11"' : 'data-bs-target="#xs-directives-links-module-FeatherIconModule-dc46306daa3887338c8e441cd730b58be70113ee2e69f0c84fc1dc48ec9813e28eb9a5d7be625d9d589bc8680024bec72bdce50260fd0e48113d331fae0cec11"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-FeatherIconModule-dc46306daa3887338c8e441cd730b58be70113ee2e69f0c84fc1dc48ec9813e28eb9a5d7be625d9d589bc8680024bec72bdce50260fd0e48113d331fae0cec11"' :
                                        'id="xs-directives-links-module-FeatherIconModule-dc46306daa3887338c8e441cd730b58be70113ee2e69f0c84fc1dc48ec9813e28eb9a5d7be625d9d589bc8680024bec72bdce50260fd0e48113d331fae0cec11"' }>
                                        <li class="link">
                                            <a href="directives/FeatherIconDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeatherIconDirective</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FormElementsModule.html" data-type="entity-link" >FormElementsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-FormElementsModule-8df8361b37dc8bbc35f2cabcd7b90dfa1415951d73f6a724b56f76236b0f71da13380d38ffe10d9d70eb2699939d58cc9fc67cfbe823b16f66f96e3da62e414c"' : 'data-bs-target="#xs-components-links-module-FormElementsModule-8df8361b37dc8bbc35f2cabcd7b90dfa1415951d73f6a724b56f76236b0f71da13380d38ffe10d9d70eb2699939d58cc9fc67cfbe823b16f66f96e3da62e414c"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-FormElementsModule-8df8361b37dc8bbc35f2cabcd7b90dfa1415951d73f6a724b56f76236b0f71da13380d38ffe10d9d70eb2699939d58cc9fc67cfbe823b16f66f96e3da62e414c"' :
                                            'id="xs-components-links-module-FormElementsModule-8df8361b37dc8bbc35f2cabcd7b90dfa1415951d73f6a724b56f76236b0f71da13380d38ffe10d9d70eb2699939d58cc9fc67cfbe823b16f66f96e3da62e414c"' }>
                                            <li class="link">
                                                <a href="components/BasicElementsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BasicElementsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditorsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EditorsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FormElementsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FormElementsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WizardComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WizardComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/GeneralModule.html" data-type="entity-link" >GeneralModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-GeneralModule-da6884627ab04b6cee203c00316583daaca7a7a175548ab7811dc6d048a5dec7e121e55a3bd7548872937414e3b262410b0d3c9c3ac0305f18c7b2a68cc56056"' : 'data-bs-target="#xs-components-links-module-GeneralModule-da6884627ab04b6cee203c00316583daaca7a7a175548ab7811dc6d048a5dec7e121e55a3bd7548872937414e3b262410b0d3c9c3ac0305f18c7b2a68cc56056"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-GeneralModule-da6884627ab04b6cee203c00316583daaca7a7a175548ab7811dc6d048a5dec7e121e55a3bd7548872937414e3b262410b0d3c9c3ac0305f18c7b2a68cc56056"' :
                                            'id="xs-components-links-module-GeneralModule-da6884627ab04b6cee203c00316583daaca7a7a175548ab7811dc6d048a5dec7e121e55a3bd7548872937414e3b262410b0d3c9c3ac0305f18c7b2a68cc56056"' }>
                                            <li class="link">
                                                <a href="components/BlankComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BlankComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FaqComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FaqComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GeneralComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GeneralComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/InvoiceComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InvoiceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PricingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PricingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TimelineComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TimelineComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/HomeModule.html" data-type="entity-link" >HomeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-HomeModule-2caccb6f35f7d2d0efb40b7445e8620087a910b9e4b73aa36140ca47c6f1a9cafc0b9b4bf3d46de1bd5b5d9d6d7999a1e6d5a78afb11c6ba30f5e8710be92c27"' : 'data-bs-target="#xs-components-links-module-HomeModule-2caccb6f35f7d2d0efb40b7445e8620087a910b9e4b73aa36140ca47c6f1a9cafc0b9b4bf3d46de1bd5b5d9d6d7999a1e6d5a78afb11c6ba30f5e8710be92c27"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-HomeModule-2caccb6f35f7d2d0efb40b7445e8620087a910b9e4b73aa36140ca47c6f1a9cafc0b9b4bf3d46de1bd5b5d9d6d7999a1e6d5a78afb11c6ba30f5e8710be92c27"' :
                                            'id="xs-components-links-module-HomeModule-2caccb6f35f7d2d0efb40b7445e8620087a910b9e4b73aa36140ca47c6f1a9cafc0b9b4bf3d46de1bd5b5d9d6d7999a1e6d5a78afb11c6ba30f5e8710be92c27"' }>
                                            <li class="link">
                                                <a href="components/HomeComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomeComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LandingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LandingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/StandardsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >StandardsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewStandardsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewStandardsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/IconsModule.html" data-type="entity-link" >IconsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-IconsModule-5733dc92c38a30927882c6cdcd12c2029d26d57d952d9d55d785fa184d897a99ce4b62ebf224d0b49f1f5aefea6ec882f1eae6766793335851a48533cefe5093"' : 'data-bs-target="#xs-components-links-module-IconsModule-5733dc92c38a30927882c6cdcd12c2029d26d57d952d9d55d785fa184d897a99ce4b62ebf224d0b49f1f5aefea6ec882f1eae6766793335851a48533cefe5093"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-IconsModule-5733dc92c38a30927882c6cdcd12c2029d26d57d952d9d55d785fa184d897a99ce4b62ebf224d0b49f1f5aefea6ec882f1eae6766793335851a48533cefe5093"' :
                                            'id="xs-components-links-module-IconsModule-5733dc92c38a30927882c6cdcd12c2029d26d57d952d9d55d785fa184d897a99ce4b62ebf224d0b49f1f5aefea6ec882f1eae6766793335851a48533cefe5093"' }>
                                            <li class="link">
                                                <a href="components/FeatherComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FeatherComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MdiComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MdiComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LayoutModule.html" data-type="entity-link" >LayoutModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' : 'data-bs-target="#xs-components-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' :
                                            'id="xs-components-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' }>
                                            <li class="link">
                                                <a href="components/BaseComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BaseComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FooterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FooterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SidebarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SidebarComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#directives-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' : 'data-bs-target="#xs-directives-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' :
                                        'id="xs-directives-links-module-LayoutModule-b5b9c2c68ba6734ab21e78d0bfd4cc6f7bae78450a2ee4b02149c46d279ecdff11c6968b78eacf23bf2a4f05b22db5939dc5ffaa13eaaadb8c23f755afb9b84e"' }>
                                        <li class="link">
                                            <a href="directives/ContentAnimateDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ContentAnimateDirective</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MobileBankingModule.html" data-type="entity-link" >MobileBankingModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-MobileBankingModule-6c08b151a773fedba2a0b54a9860cce5aa66fa2f38c1fb5bfa09745327ddc686524a4eaf20f61f6b88e22ea759d3680a372763ad6267fb5448438247ef5d2371"' : 'data-bs-target="#xs-components-links-module-MobileBankingModule-6c08b151a773fedba2a0b54a9860cce5aa66fa2f38c1fb5bfa09745327ddc686524a4eaf20f61f6b88e22ea759d3680a372763ad6267fb5448438247ef5d2371"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-MobileBankingModule-6c08b151a773fedba2a0b54a9860cce5aa66fa2f38c1fb5bfa09745327ddc686524a4eaf20f61f6b88e22ea759d3680a372763ad6267fb5448438247ef5d2371"' :
                                            'id="xs-components-links-module-MobileBankingModule-6c08b151a773fedba2a0b54a9860cce5aa66fa2f38c1fb5bfa09745327ddc686524a4eaf20f61f6b88e22ea759d3680a372763ad6267fb5448438247ef5d2371"' }>
                                            <li class="link">
                                                <a href="components/MobileBankingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MobileBankingComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProductsModule.html" data-type="entity-link" >ProductsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProductsModule-4f168963369b79b263e063ae52ec0bcac931d8dfeecdf90a1bf2546128cb2b9594f07b070255192bf0f2193e3846061607b2a4a614939c76ba529e6d227a875c"' : 'data-bs-target="#xs-components-links-module-ProductsModule-4f168963369b79b263e063ae52ec0bcac931d8dfeecdf90a1bf2546128cb2b9594f07b070255192bf0f2193e3846061607b2a4a614939c76ba529e6d227a875c"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProductsModule-4f168963369b79b263e063ae52ec0bcac931d8dfeecdf90a1bf2546128cb2b9594f07b070255192bf0f2193e3846061607b2a4a614939c76ba529e6d227a875c"' :
                                            'id="xs-components-links-module-ProductsModule-4f168963369b79b263e063ae52ec0bcac931d8dfeecdf90a1bf2546128cb2b9594f07b070255192bf0f2193e3846061607b2a4a614939c76ba529e6d227a875c"' }>
                                            <li class="link">
                                                <a href="components/AddBenefitComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddBenefitComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddProductComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddProductComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddProductSubItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddProductSubItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddRequirementComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddRequirementComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListAllProductsAsCardsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListAllProductsAsCardsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListProductsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListProductsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProductAsCardsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProductAsCardsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProductCategoriesAsCardsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProductCategoriesAsCardsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProductCategoriesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProductCategoriesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProductCategoriesComponentSubItem.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProductCategoriesComponentSubItem</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProductSubCategoriesAsCardsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProductSubCategoriesAsCardsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewCategoriesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewCategoriesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewProductComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewProductComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProductsRoutingModule.html" data-type="entity-link" >ProductsRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/RbacModule.html" data-type="entity-link" >RbacModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-RbacModule-2b3c05b0e6a803e3db1668b038fd4dcb47954a3bbd46d061ea9be64e83a90ffe944d7b58edaa6d8da44fae63034ff7ea816d79c871dab44dbb1498533831b570"' : 'data-bs-target="#xs-components-links-module-RbacModule-2b3c05b0e6a803e3db1668b038fd4dcb47954a3bbd46d061ea9be64e83a90ffe944d7b58edaa6d8da44fae63034ff7ea816d79c871dab44dbb1498533831b570"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-RbacModule-2b3c05b0e6a803e3db1668b038fd4dcb47954a3bbd46d061ea9be64e83a90ffe944d7b58edaa6d8da44fae63034ff7ea816d79c871dab44dbb1498533831b570"' :
                                            'id="xs-components-links-module-RbacModule-2b3c05b0e6a803e3db1668b038fd4dcb47954a3bbd46d061ea9be64e83a90ffe944d7b58edaa6d8da44fae63034ff7ea816d79c871dab44dbb1498533831b570"' }>
                                            <li class="link">
                                                <a href="components/AddProfileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddProfileComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddRoleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddRoleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddUserComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddUserComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChangeProfileModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChangeProfileModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DeleteRoleModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeleteRoleModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListUsersComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListUsersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfileRolesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfileRolesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProfilesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfilesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RolesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RolesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewProfileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewProfileComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ViewUserComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ViewUserComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/RequestsModule.html" data-type="entity-link" >RequestsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-RequestsModule-0a98aa18cb58ffab9b2601e5ae0267ce67a4e034125a58e0154e94ba3682beab41f761fb1c88b775480d257fb4e03e6aee6580203e43219be31f4bd644ce5c67"' : 'data-bs-target="#xs-components-links-module-RequestsModule-0a98aa18cb58ffab9b2601e5ae0267ce67a4e034125a58e0154e94ba3682beab41f761fb1c88b775480d257fb4e03e6aee6580203e43219be31f4bd644ce5c67"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-RequestsModule-0a98aa18cb58ffab9b2601e5ae0267ce67a4e034125a58e0154e94ba3682beab41f761fb1c88b775480d257fb4e03e6aee6580203e43219be31f4bd644ce5c67"' :
                                            'id="xs-components-links-module-RequestsModule-0a98aa18cb58ffab9b2601e5ae0267ce67a4e034125a58e0154e94ba3682beab41f761fb1c88b775480d257fb4e03e6aee6580203e43219be31f4bd644ce5c67"' }>
                                            <li class="link">
                                                <a href="components/ListRequestsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListRequestsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/RequestsRoutingModule.html" data-type="entity-link" >RequestsRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SetupsModule.html" data-type="entity-link" >SetupsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-SetupsModule-a22ece039f974a0a4079b0302546ff510eab0ef41881aaa98eafe43b65c5aff63010d31d3213391130c9d133d3d88e81054d4c73ac837a08767bc5f9b9719fca"' : 'data-bs-target="#xs-components-links-module-SetupsModule-a22ece039f974a0a4079b0302546ff510eab0ef41881aaa98eafe43b65c5aff63010d31d3213391130c9d133d3d88e81054d4c73ac837a08767bc5f9b9719fca"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SetupsModule-a22ece039f974a0a4079b0302546ff510eab0ef41881aaa98eafe43b65c5aff63010d31d3213391130c9d133d3d88e81054d4c73ac837a08767bc5f9b9719fca"' :
                                            'id="xs-components-links-module-SetupsModule-a22ece039f974a0a4079b0302546ff510eab0ef41881aaa98eafe43b65c5aff63010d31d3213391130c9d133d3d88e81054d4c73ac837a08767bc5f9b9719fca"' }>
                                            <li class="link">
                                                <a href="components/AddAtmComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddAtmComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddBranchComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddBranchComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AddServiceComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AddServiceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DefineRegionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DefineRegionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListAtmsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListAtmsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListBranchesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListBranchesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListServicesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListServicesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RegionsListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RegionsListComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SetupsRoutingModule.html" data-type="entity-link" >SetupsRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SharedModule.html" data-type="entity-link" >SharedModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-SharedModule-2f1e810d14babd2842d061f500d61f5d040d564e471bd8182aead28b484891462ec24ef72451c144e1a4393af90fc024aaab542e762b9de66468dc222b653ede"' : 'data-bs-target="#xs-components-links-module-SharedModule-2f1e810d14babd2842d061f500d61f5d040d564e471bd8182aead28b484891462ec24ef72451c144e1a4393af90fc024aaab542e762b9de66468dc222b653ede"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SharedModule-2f1e810d14babd2842d061f500d61f5d040d564e471bd8182aead28b484891462ec24ef72451c144e1a4393af90fc024aaab542e762b9de66468dc222b653ede"' :
                                            'id="xs-components-links-module-SharedModule-2f1e810d14babd2842d061f500d61f5d040d564e471bd8182aead28b484891462ec24ef72451c144e1a4393af90fc024aaab542e762b9de66468dc222b653ede"' }>
                                            <li class="link">
                                                <a href="components/CompareImageComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CompareImageComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ConfirmDialogComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ConfirmDialogComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CustomNgxTable.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CustomNgxTable</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelActiveComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LabelActiveComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelBooleanComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LabelBooleanComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelCompletedComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LabelCompletedComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelOnlineComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LabelOnlineComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelPassedComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LabelPassedComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelSystemCustomRoleComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LabelSystemCustomRoleComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LabelTaskStatusComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LabelTaskStatusComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NotificationModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotificationModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TableFiltersComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TableFiltersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TableHeaderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TableHeaderComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TablesModule.html" data-type="entity-link" >TablesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-TablesModule-141c638ad42ff0f5ab4b2767ba41fed9ead43729d4949f74f7b397f1c89966f0467343ccd09413b2f4a05103fec16b9b8fa1a3b234be0d7110ce314155f46328"' : 'data-bs-target="#xs-components-links-module-TablesModule-141c638ad42ff0f5ab4b2767ba41fed9ead43729d4949f74f7b397f1c89966f0467343ccd09413b2f4a05103fec16b9b8fa1a3b234be0d7110ce314155f46328"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TablesModule-141c638ad42ff0f5ab4b2767ba41fed9ead43729d4949f74f7b397f1c89966f0467343ccd09413b2f4a05103fec16b9b8fa1a3b234be0d7110ce314155f46328"' :
                                            'id="xs-components-links-module-TablesModule-141c638ad42ff0f5ab4b2767ba41fed9ead43729d4949f74f7b397f1c89966f0467343ccd09413b2f4a05103fec16b9b8fa1a3b234be0d7110ce314155f46328"' }>
                                            <li class="link">
                                                <a href="components/BasicTableComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BasicTableComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DataTableComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DataTableComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NgxDatatableComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NgxDatatableComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TablesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TablesComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/UiComponentsModule.html" data-type="entity-link" >UiComponentsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-UiComponentsModule-9638ca8f258ae0ed964bb87f488f1a8d9358e6173047ce02110dbefa2e9e99f46811a8859dfd10c0b75236e61f303c3f3816f72838a543238329394e1a078787"' : 'data-bs-target="#xs-components-links-module-UiComponentsModule-9638ca8f258ae0ed964bb87f488f1a8d9358e6173047ce02110dbefa2e9e99f46811a8859dfd10c0b75236e61f303c3f3816f72838a543238329394e1a078787"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-UiComponentsModule-9638ca8f258ae0ed964bb87f488f1a8d9358e6173047ce02110dbefa2e9e99f46811a8859dfd10c0b75236e61f303c3f3816f72838a543238329394e1a078787"' :
                                            'id="xs-components-links-module-UiComponentsModule-9638ca8f258ae0ed964bb87f488f1a8d9358e6173047ce02110dbefa2e9e99f46811a8859dfd10c0b75236e61f303c3f3816f72838a543238329394e1a078787"' }>
                                            <li class="link">
                                                <a href="components/AccordionComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccordionComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AlertsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AlertsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BadgesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BadgesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BreadcrumbsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BreadcrumbsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ButtonGroupComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ButtonGroupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ButtonsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ButtonsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CardsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CardsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CarouselComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CarouselComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/CollapseComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CollapseComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DatepickerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DatepickerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DropdownsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DropdownsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ListGroupComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ListGroupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MediaObjectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MediaObjectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavbarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/NavsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NavsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PaginationComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PaginationComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PopoversComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PopoversComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ProgressComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProgressComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RatingComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RatingComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ScrollbarComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ScrollbarComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SpinnersComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SpinnersComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TimepickerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TimepickerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TooltipsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TooltipsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TypeaheadComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TypeaheadComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UiComponentsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UiComponentsComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/ApproveProfileComponent.html" data-type="entity-link" >ApproveProfileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChangePasswordComponent-1.html" data-type="entity-link" >ChangePasswordComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FirstTimeLoginComponent-1.html" data-type="entity-link" >FirstTimeLoginComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ForgotPasswordComponent-1.html" data-type="entity-link" >ForgotPasswordComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavbarComponent-1.html" data-type="entity-link" >NavbarComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ChannelDetailsWrapper.html" data-type="entity-link" >ChannelDetailsWrapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/CharOnlyValidatorService.html" data-type="entity-link" >CharOnlyValidatorService</a>
                            </li>
                            <li class="link">
                                <a href="classes/CheckPasswordSecurityValidator.html" data-type="entity-link" >CheckPasswordSecurityValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/CompanyEmailValidator.html" data-type="entity-link" >CompanyEmailValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/EmployeePhoneNumberValidators.html" data-type="entity-link" >EmployeePhoneNumberValidators</a>
                            </li>
                            <li class="link">
                                <a href="classes/PeoplesData.html" data-type="entity-link" >PeoplesData</a>
                            </li>
                            <li class="link">
                                <a href="classes/Profile.html" data-type="entity-link" >Profile</a>
                            </li>
                            <li class="link">
                                <a href="classes/Role.html" data-type="entity-link" >Role</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DataExportationService.html" data-type="entity-link" >DataExportationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FormService.html" data-type="entity-link" >FormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GlobalService.html" data-type="entity-link" >GlobalService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HttpService.html" data-type="entity-link" >HttpService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService.html" data-type="entity-link" >NotificationService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interceptors-links"' :
                            'data-bs-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/CheckTokenValidityInterceptor.html" data-type="entity-link" >CheckTokenValidityInterceptor</a>
                            </li>
                            <li class="link">
                                <a href="interceptors/SystemHttpInterceptor.html" data-type="entity-link" >SystemHttpInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/AuthGuard.html" data-type="entity-link" >AuthGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/AuthGuard-1.html" data-type="entity-link" >AuthGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/MenuItem.html" data-type="entity-link" >MenuItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Person.html" data-type="entity-link" >Person</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Question.html" data-type="entity-link" >Question</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});