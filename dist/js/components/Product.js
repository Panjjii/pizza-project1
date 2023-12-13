import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

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
    // app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });
    thisProduct.element.dispatchEvent(event);
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

export default Product;