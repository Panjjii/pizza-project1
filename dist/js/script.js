/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };
  class Product{
    constructor(id, data){
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      thisProduct.initAccordion();
      console.log('New Product: ', thisProduct);
    }
    renderInMenu(){
      const thisProduct = this;

      /* generate HTML based on template */
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /* find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* add element to menu */
      menuContainer.appendChild(thisProduct.element);
    }
    getElements(){
      const thisProduct = this;
      thisProduct.dom = {};
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }
    initAccordion(){
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      thisProduct.accordionTrigger.addEventListener('click', function(event){
      /* START: add event listener to clickable trigger on event click */
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const ActiveProduct = document.querySelector(select.all.menuProductsActive);
        console.log('Active: ', ActiveProduct);
        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if (ActiveProduct != null && ActiveProduct != thisProduct.element){
          ActiveProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
      });
    }
    initOrderForm(){
      const thisProduct = this;
      console.log('Order form:');
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.addToCart();
        thisProduct.processOrder();
      });
    }
    processOrder(){
      const thisProduct = this;
      console.log('Processing');
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData', formData);
      /* set price to default */
      let price = thisProduct.data.price;
      /* for every category (param)... */
      for (let paramID in thisProduct.data.params){
        /* determine param value, e.g. paramID = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... } */
        const param = thisProduct.data.params[paramID];
        console.log(paramID, param);
        /* for every option in this category */
        for (let optionID in param.options){
          /* determine option value, e.g. optionID = 'olives', option = { label: 'Olives', price: 2, default: true } */
          const option = param.options[optionID];
          console.log('Ingredients: ', optionID, option);
          /* if there is a param compatible with the category in formData (the same name with paramID) */
          if (formData[paramID] && formData[paramID].includes(optionID)){
            /* if the option is not default */
            if(!option.default){
              /* add proper price to let price */
              price += option.price;
            }
          } else {
            /* if the option is default */
            if(option.default) {
              /* reduce let price */
              price -= option.price;
            }
          }
          const piece = thisProduct.imageWrapper.querySelector('.' + paramID + '-' + optionID);
          if (piece){
            if (formData[paramID] && formData[paramID].includes(optionID)){
              piece.classList.add(classNames.menuProduct.imageVisible);
            } else {
              piece.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }
      /* update calculated price in the HTML */
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
    }
    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('Updated', function(){
        thisProduct.processOrder();
      });
    }
    addToCart(){
      const thisProduct = this;
      app.cart.add(thisProduct.prepareCartProduct());
    }
    prepareCartProduct(){
      const thisProduct = this;
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.priceSingle * thisProduct.amountWidget.value,
        params: thisProduct.prepareCartProductParams()
      };
      return productSummary;
    }
    prepareCartProductParams(){
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      const params = {};
      for(let paramID in thisProduct.data.params) {
        const param = thisProduct.data.params[paramID];
        params[paramID] = {
          label: param.label,
          options: {}
        };
        for(let optionID in param.options) {
          const option = param.options[optionID];
          const optionSelected = formData[paramID] && formData[paramID].includes(optionID);
          if(optionSelected){
            params[paramID].options[optionID] = option.label;
          }
        }
      }
      console.log('Params: ', params);
      return params;
    }
  }
  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      console.log('Amount Widget: ', thisWidget);
      console.log('Constructor elements: ', element);
      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }
    getElements(element){
      const thisWidget = this;
      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }
    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      if (thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
      }
      thisWidget.input.value = thisWidget.value;
      thisWidget.announce();
    }
    initActions(){
      const thisWidget = this;
      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }
    announce(){
      const thisWidget = this;
      const event = new CustomEvent('Updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }
  class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('New Cart: ', thisCart);
    }
    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    }
    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove', function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      })
    }
    add(menuProduct){
      const thisCart = this;
      const generatedHTML = templates.cartProduct(menuProduct);
      const product = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(product);
      thisCart.products.push(new cartProduct(menuProduct, product));
      console.log('This Cart products', thisCart.products);
      thisCart.update();
    }
    update(){
      const thisCart = this;
      const deliveryFee = settings.cart.defaultDeliveryFee;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      for (let product of thisCart.products){
        thisCart.totalNumber += product.amount;
        thisCart.subtotalPrice += product.price;
      }
      thisCart.totalPrice = 0;
      if (thisCart.subtotalPrice != 0){
        thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      } else {
        thisCart.totalPrice = 0;
        thisCart.dom.deliveryFee.innerHTML = 0;
      }
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      for (let price of thisCart.dom.totalPrice){
        price.innerHTML = thisCart.totalPrice;
      }
      console.log('Total price: ', thisCart.dom.productList);
    }
    remove(event){
      const thisCart = this;
      event.dom.wrapper.remove();
      const removeElem = thisCart.products.indexOf(event);
      thisCart.products.splice(removeElem, 1);
      thisCart.update();
    }
    sendOrder(){
      const thisCart = this;
      const url = settings.db.url + '/' + settings.db.orders;
      const payloads = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };
      for(let prod of thisCart.products){
        payloads.products.push(prod.getData());
      }
      console.log('Payloads: ', payloads);
      const options = {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      };
      fetch(url, options)
        .then(function(Response){
          return Response.json();
        }).then(function(parsedResponse){
          console.log('Parsed Response', parsedResponse);
        });
    }
  }
  class cartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
      console.log(thisCartProduct);
    }
    getElements(element){
      const thisCartProduct = this;
      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }
    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('Updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }
    initActions(){
      const thisCartProduct = this;
      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }
    remove(){
      const thisCartProduct = this;
      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }
    getData(){
      const thisCartProduct = this;
      const orderSummary = {
        id: thisCartProduct.id,
        amount: thisCartProduct.amountWidget.value,
        price: thisCartProduct.priceSingle * thisCartProduct.amountWidget.value,
        priceSingle: thisCartProduct.priceSingle,
        name: thisCartProduct.name,
        params: {}
      };
      return orderSummary;
    }
  }
  const app = {
    initMenu: function(){
      const thisApp = this;
      console.log('thisAppdata: ', thisApp.data);
      for (let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initData: function(){
      const thisApp = this;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsed Response', parsedResponse);
          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;
          /* execute initMenu method */
          thisApp.initMenu();
        });
      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },
    initCart: function(){
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);
      thisApp.initData();
      thisApp.initCart();
    },
  };
  app.init();
}