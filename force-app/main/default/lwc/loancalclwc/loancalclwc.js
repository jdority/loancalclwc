import { LightningElement, track, api } from "lwc";
import chartjs from '@salesforce/resourceUrl/chartJS';
import { loadScript } from 'lightning/platformResourceLoader';

export default class CalculatorInLwc extends LightningElement {

    @track principalNumber;
    @track interestNumber;
    @track monthsNumber;

    @track totalPayment;
    @track totalInterest;

    // Payment table configuration
    @api keyField = "number";
    @api rows = [];
    @api interestLine1 = [];
    @api principalLine2 = [];
    @api columns = [{
            label: "Payment#",
            fieldName: "number",
            type: "number"
        },
        {
            label: "Balance",
            fieldName: "balance",
            type: "currency"
        },
        {
            label: "Payment Amount",
            fieldName: "payment",
            type: "currency"
        },
        {
            label: "Interest",
            fieldName: "interest",
            type: "currency"
        },
        {
            label: "Principal",
            fieldName: "principal",
            type: "currency"
        }
    ];

    // Payment Chart Configuration
    @track chart1Configuration = {};
    @track chart2Configuration = {};

    resultValue;
    monthlyrate;
    payment;

    /**
     * LWC Lifecycle hook called when this component is added to the DOM.
     * We will attempt to load the Chart.js library
     */
    connectedCallback() {

        // Attempt to load the Chart.js library from the static resources
        loadScript(this, chartjs).then(() => {
            console.log("Chart.js has been loaded!");
        })
        .catch(error => {
            console.error("Error loading Chart.js" + error);
        });
    }

    handleNumberPChange(event) {

        this.principalNumber = parseInt(event.target.value);
    }
    handleNumberIChange(event) {

        this.interestNumber = parseFloat(event.target.value);
    }
    handleNumberMChange(event) {

        this.monthsNumber = parseInt(event.target.value);
    }

    calculate() {

        try {

            // Calculate Payments
            let result = this.amortize(this.principalNumber, this.interestNumber, this.monthsNumber);
            console.log(result);

            // Update totals
            this.totalPayment = result.totalPayment;
            this.totalInterest = result.totalInterest;

            // Rebuild Payment Table
            this.rows = result.payments.slice();            
            
            // Chart Data Sets
            let paymentLabels     = [];
            let principalPayments = [];
            let interestPayments  = [];
            for (let payment of result.payments) {
                paymentLabels.push(payment.number.toString());
                principalPayments.push(payment.principal);
                interestPayments.push(payment.interest);
            }

            // Line Graph
            /*
            this.chart1Configuration = {
                type: "line",
                data: {
                    labels: paymentLabels,
                    datasets: [
                        {
                            label: "Principal",
                            borderColor: "blue",
                            fill: false,
                            data: principalPayments
                        },
                        {
                            label: "Interest",
                            borderColor: "red",
                            fill: false,
                            data: interestPayments
                        }
                    ]                    
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "top"
                        },
                        title: {
                            display: true,
                            text: "Payments"
                        }
                    }
                }
            }
            */

            // Bar Graph
            this.chart1Configuration = {
                type: "bar",
                data: {
                    labels: paymentLabels,
                    datasets: [
                        {
                            label: "Principal",
                            backgroundColor: "#5c9efa",
                            data: principalPayments
                        },
                        {
                            label: "Interest",
                            backgroundColor: "#fa5c6a",
                            data: interestPayments
                        }
                    ]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: "Payments"
                    },
                    scales: {
                        xAxes: [
                            {
                                stacked: true
                            }
                        ],
                        yAxes: [
                            {
                                stacked: true
                            }
                        ]
                    }
                }
            };

            // Pie Chart (Loan Breakdown)
            this.chart2Configuration = {
                type: "pie",
                data: {
                    labels: ["Principal", "Interest"],
                    datasets: [{
                        label: "Breakdown",
                        backgroundColor: ["#5c9efa", "#fa5c6a"],
                        data: [result.totalPayment, result.totalInterest]
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: "Loan Breakdown"
                    }
                }
            };
            

            // Draw the charts
            let ctx1 = this.template.querySelector('canvas.chart1').getContext('2d');
            new window.Chart(ctx1, this.chart1Configuration);

            let ctx2 = this.template.querySelector('canvas.chart2').getContext('2d');
            new window.Chart(ctx2, this.chart2Configuration);

        } catch (err) {
            console.error(err);
        }
    }

    amortize(principal, interestRate, terms) {

        console.log(interestRate);

        // Calculate the monthly payment
        let monthlyRate = interestRate / 100 / 12;
        let payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, terms)) / (Math.pow(1 + monthlyRate, terms) - 1);
        let totalPayment = payment * terms;
        let totalInterest = totalPayment - principal;

        // Build the results
        let result = {
            principal: principal,
            annualRate: interestRate,
            monthlyRate: monthlyRate,
            terms: terms,
            payment: payment.toFixed(2),
            totalPayment: totalPayment.toFixed(2),
            totalInterest: totalInterest.toFixed(2),
            payments: []
        };        

        let balance = principal;
        for (let count = 0; count < terms; count++) {

            let paymentInterest = balance * monthlyRate;

            // populates amortization table
            result.payments.push({
                    number: count + 1,
                    payment: payment.toFixed(2),
                    balance: balance.toFixed(2),
                    interest: paymentInterest.toFixed(2),
                    principal: (payment - paymentInterest).toFixed(2)
            });

            // update the balance for each loop iteration
            balance -= payment - paymentInterest;
        }

        return result;
    }
}