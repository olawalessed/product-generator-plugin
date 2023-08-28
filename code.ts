

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 200, height: 270, title: "Product Detail Generator" });

function generateRandomNumber() {
  return Math.floor(Math.random() * 20) + 1;
}

// Fetch a random product from the provided API
async function fetchProduct() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const response = await fetch(`https://fakestoreapi.com/products/${generateRandomNumber()}`);
  const productData = await response.json();
  return productData;
}


figma.ui.onmessage = async msg => {
  const productData = await fetchProduct();
  const productName = productData.title;

  switch (msg.type) {
    case 'title':
      handleTextElement(productName);
      break;
    case 'description':
      handleTextElement(productData.description);
      break;
    case 'category':
      handleTextElement(productData.category);
      break;
    case 'price':
      handleTextElement(`$${productData.price}`);
      break;
    // Add cases for other message types -- To do
    case 'image':
      handleImageElement(productData.image)
      break;
    default:
      // No specific action for the message type
      break;
  }
};

function handleTextElement(text: string) {
  // Check if a text element is selected
  if (figma.currentPage.selection.length === 1 && figma.currentPage.selection[0].type === 'TEXT') {
    const textNode = figma.currentPage.selection[0];
    textNode.characters = text;
  } else {
    // If no text element is selected, create a new text node
    const textNode = figma.createText();
    textNode.characters = text;
    textNode.x = 100;
    textNode.y = 100;
    figma.currentPage.appendChild(textNode);

    const nodes = [textNode]; // Create an array of nodes to be selected
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }
}

async function handleImageElement(imageURL: string) {
  try {
    const image = await figma.createImageAsync(imageURL);

    // Check if a rectangle node is selected
    if (figma.currentPage.selection.length === 1 && figma.currentPage.selection[0].type === 'RECTANGLE') {
      const rectangleNode = figma.currentPage.selection[0];

      const {width, height} = await image.getSizeAsync()

      // Resize the rectangle node to match the image's dimensions
      

      // Calculate the aspect ratio of the image and the selected rectangle
      const imageAspectRatio = width / height;
      const rectangleAspectRatio = rectangleNode.width / rectangleNode.height;

      // Determine how to resize the image to fit the rectangle
      if (imageAspectRatio > rectangleAspectRatio) {
        // Fit the image's width to the rectangle's width
        rectangleNode.resizeWithoutConstraints(rectangleNode.width, rectangleNode.width / imageAspectRatio);
      } else {
        // Fit the image's height to the rectangle's height
        rectangleNode.resizeWithoutConstraints(rectangleNode.height * imageAspectRatio, rectangleNode.height);
      }


      // Update the rectangle's fill to the fetched image
      rectangleNode.fills = [
        {
          type: 'IMAGE',
          imageHash: image.hash,
          scaleMode: 'FILL'
        }
      ];
    } else {
      // Create a new rectangle node and set its dimensions and fill
      const rectangleNode = figma.createRectangle();
      const {width, height} = await image.getSizeAsync()
      rectangleNode.resize(width, height);
      rectangleNode.fills = [
        {
          type: 'IMAGE',
          imageHash: image.hash,
          scaleMode: 'FIT'
        }
      ];

      // Append the new rectangle node to the current page
      figma.currentPage.appendChild(rectangleNode);

      // Select the new rectangle node and bring it into view
      const nodes = [rectangleNode];
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
    

  } catch (error) {
    console.error(error);
    figma.closePlugin();
  }
}

