const { format } = require("date-fns");
const asyncHandler = require("express-async-handler");
const InvoiceModel = new (require ("../models/invoiceModel"))();

const fetchInvoice = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const invoice_id = req.params.invoice_id;
  try {
    const invoice = await InvoiceModel.fetchInvoice(user_id, invoice_id);

    res.json({ invoice });
  } catch (error) {
    console.error(error);
    res.status(404);
    throw new Error ("Invoice does not exist");
  }
});

const generateInvoice = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { items } = req.body;

  const total_price = items.reduce((acc, curr) => {
    switch (curr.package_type) {
      case "individual":
        return acc + parseInt(curr.amount) * parseFloat(curr.product.unit_price)
      case "small":
        return acc + parseInt(curr.amount) * parseFloat(curr.product.package_price)
      case "big":
        return acc + parseInt(curr.amount) * parseFloat(curr.product.big_package_price)
    }
  }, 0);
  
  try {
    const invoice = await InvoiceModel.generateInvoice(user_id, total_price, items);

    res.json({ invoice_id: invoice.id });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occured while generating invoice");
  }
});

const sendInvoice = asyncHandler(async (req, res) => {
  const { invoicePDF, invoice_id, email } = req.body;
  //const attachment = fs.readFileSync("./TestInvoice-2.pdf");
  console.log(typeof invoicePDF);
  try {
    const response = await sgMail.send({
      to: email,
      from: process.env.SENDGRID_TEST_SENDER,
      subject: `Milestone Autosupplies Invoice - ${format(new Date(), "P")}`,
      attachments: [
        { 
          filename: `Invoice.pdf`, 
          content: invoicePDF,
        }
      ],
      html: "<div>Thank you for choosing Milestone Autosupplies!<div> <div> Your invoice is attached. You can reply to this email with any questions you have. <div>"
    });

    console.log(response[0].statusCode);
    console.log(response[0].headers);

    await InvoiceModel.updateSentStatus(invoice_id);
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occured while sending invoice");
  }
});

module.exports = { fetchInvoice, generateInvoice, sendInvoice };