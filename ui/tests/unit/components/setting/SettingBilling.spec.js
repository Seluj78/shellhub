import Vuex from 'vuex';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import SettingBilling from '@/components/setting/SettingBilling';
import { actions, authorizer } from '../../../../src/authorizer';

describe('SettingBilling', () => {
  const localVue = createLocalVue();
  localVue.use(Vuex);

  let wrapper;

  const accessType = ['owner', 'administrator', 'operator', 'observer'];

  const hasAuthorization = {
    owner: true,
    administrator: true,
    operator: false,
    observer: false,
  };

  const stripeData = {
    latest_invoice: { amount_due: 0, amount_paid: 0 },
    upcoming_invoice: { amount_due: 0, amount_paid: 0 },
    product_description: 'Premium usage',
    card: {
      brand: 'visa', exp_year: 2024, exp_month: 4, last4: '4242',
    },
  };

  const info2 = {
    periodEnd: '2021-12-24T18:16:21Z',
    description: 'Shellhub',
    latestPaymentDue: 0,
    latestPaymentPaid: 0,
    nextPaymentDue: 0,
    nextPaymenPaid: 0,
  };

  const card2 = {
    brand: 'visa',
    expYear: 2024,
    default: true,
    expMonth: 4,
    last4: '4042',
    id: 'pm_123',
  };

  // describe('Renders component according to billing instance', () => {
  const tests = [
    // {
    //   description: 'Create subscription',
    //   computed: {
    //     active: false,
    //     state: 'inactive',
    //   },
    //   data: {
    //     renderData: false,
    //   },
    //   instance: {
    //     active: false,
    //     state: 'inactive',
    //     current_period_end: 0,
    //     customer_id: '',
    //     subscription_id: '',
    //     payment_method_id: '',
    //   },
    //   template: {
    //     'subscriptionPaymentMethod-component': true,
    //     'freePlan-div': true,
    //     'premiumPlan-div': false,
    //     'subscriptionActive-div': false,
    //     'updatePaymentMethod-component': false,
    //     'billingIcon-component': false,
    //     'cancel-div': false,
    //   },
    // },
    // {
    //   description: 'Pending request',
    //   owner: true,
    //   computed: {
    //     active: true,
    //     state: 'pending',
    //   },
    //   data: {
    //     renderData: true,
    //   },
    //   instance: {
    //     active: true,
    //     state: 'pending',
    //     current_period_end: 0,
    //     customer_id: 'cus_123',
    //     subscription_id: 'sub_123',
    //     payment_method_id: 'pm_123',
    //   },
    //   template: {
    //     'subscriptionPaymentMethod-component': false,
    //     'pendingRetrial-div': true,
    //     'freePlan-div': false,
    //     'premiumPlan-div': false,
    //     'subscriptionActive-div': false,
    //     'updatePaymentMethod-component': false,
    //     'billingIcon-component': false,
    //     'cancel-div': false,
    //     'activeLoading-div': false,
    //   },
    // },
    {
      description: 'Premium usage',
      computed: {
        active: true,
        state: 'processed',
      },
      data: {
        renderData: true,
      },
      instance: {
        active: true,
        state: 'processed',
        current_period_end: 0,
        customer_id: 'cus_123',
        subscription_id: 'sub_123',
        payment_method_id: 'pm_123',
        info: info2,
        card: card2,
      },
      template: {
        'subscriptionPaymentMethod-component': false,
        'freePlan-div': false,
        // 'premiumPlan-div': true,
        // 'subscriptionActive-div': true,
        // 'updatePaymentMethod-component': true,
        // 'billingIcon-component': true,
        // 'cancel-div': true,
        // 'activeLoading-div': false,
      },
    },
  ];

  const storeVuex = (billing, currentAccessType) => new Vuex.Store({
    namespaced: true,
    state: {
      billing,
      currentAccessType,
    },
    getters: {
      'billing/active': (state) => state.billing.active || false,
      'billing/status': (state) => state.billing.state || 'inactive',
      'billing/get': (state) => state.billing,
      'auth/accessType': (state) => state.currentAccessType,
    },
    actions: {
      'billing/getSubscription': () => stripeData,
      'namespaces/get': () => {},
      'snackbar/showSnackbarSuccessAction': () => {},
      'snackbar/showSnackbarErrorAction': () => {},
      'snackbar/showSnackbarErrorDefault': () => {},
    },
  });

  tests.forEach((test) => {
    accessType.forEach((currentAccessType) => {
      describe(`${test.description} ${currentAccessType}`, () => {
        beforeEach(() => {
          wrapper = shallowMount(SettingBilling, {
            store: storeVuex(test.instance, currentAccessType),
            localVue,
            stubs: ['fragment'],
            mocks: {
              $authorizer: authorizer,
              $actions: actions,
              $stripe: {
                elements: () => ({
                  create: () => ({
                    mount: () => null,
                  }),
                }),
              },
            },
          });

          wrapper.setData({ renderData: test.data.renderData });
          wrapper.setData({ billingData: { info: { nextPaymentDue: 0 }, card: { brand: 'cc-visa' } } });
        });

        ///////
        // Component Rendering
        //////

        it('Is a Vue instance', () => {
          expect(wrapper).toBeTruthy();
        });
        it('Renders the component', () => {
          expect(wrapper.html()).toMatchSnapshot();
        });

        ///////
        // Data checking
        //////

        it('Compare data with default value', () => {
          if (hasAuthorization[currentAccessType]) {
            Object.keys(test.data).forEach((item) => {
              expect(wrapper.vm[item]).toEqual(test.data[item]);
            });
          }
        });
        it('Process data in the computed', () => {
          Object.keys(test.computed).forEach((item) => {
            expect(wrapper.vm[item]).toEqual(test.computed[item]);
          });
          expect(wrapper.vm.hasAuthorization).toEqual(hasAuthorization[currentAccessType]);
        });

        //////
        // HTML validation
        //////

        it('Renders the template with data', () => {
          Object.keys(test.template).forEach((item) => {
            if (hasAuthorization[currentAccessType] || (test.computed.state === 'processed' && hasAuthorization[currentAccessType])) {
              expect(wrapper.find(`[data-test="${item}"]`).exists()).toBe(test.template[item]);
            } else {
              expect(wrapper.find(`[data-test="${item}"]`).exists()).toBe(false);
            }
          });
        });
      });
    });
  });
});
