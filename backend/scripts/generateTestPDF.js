const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const outputPath = path.join(__dirname, 'test-sop.pdf');
const doc        = new PDFDocument({ margin: 50, size: 'A4' });
doc.pipe(fs.createWriteStream(outputPath));

// ── Cover Page ────────────────────────────────────────────────────────────────
doc.fontSize(24).font('Helvetica-Bold')
   .text('STANDARD OPERATING PROCEDURES', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(16).font('Helvetica')
   .text('Acme Corporation — HR & Operations Manual', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).text('Version 3.1 | Effective January 2025', { align: 'center' });
doc.moveDown(2);
doc.fontSize(11).text(
  'This document contains official Standard Operating Procedures for all Acme Corporation employees. ' +
  'All employees are required to read, understand, and comply with the procedures outlined in this manual. ' +
  'Questions should be directed to HR at hr@acmecorp.com or your direct manager.',
  { align: 'justify' }
);

// ── Page 2: Refund Policy ─────────────────────────────────────────────────────
doc.addPage();
doc.fontSize(18).font('Helvetica-Bold').text('SECTION 1: REFUND POLICY');
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica-Bold').text('1.1 Overview');
doc.fontSize(11).font('Helvetica').text(
  'All customer refund requests must be processed within 5 business days of receipt. ' +
  'Refunds are applicable only for purchases made within 30 days of the original transaction date. ' +
  'The refund amount will be credited back to the original payment method used at the time of purchase.'
);
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('1.2 Step-by-Step Refund Process');
doc.fontSize(11).font('Helvetica');
doc.text('Step 1: Customer submits a refund request via the support portal at support.acmecorp.com or by emailing refunds@acmecorp.com with their order number and reason for refund.');
doc.moveDown(0.3);
doc.text('Step 2: Support agent logs into the Order Management System (OMS) and verifies the purchase details including date, amount, and product information.');
doc.moveDown(0.3);
doc.text('Step 3: Agent checks eligibility criteria — the item must be unused, in original packaging, and purchased within the 30-day refund window.');
doc.moveDown(0.3);
doc.text('Step 4: If eligible, agent initiates the refund in the payment gateway dashboard and selects the original payment method for the credit.');
doc.moveDown(0.3);
doc.text('Step 5: Customer receives an automated confirmation email within 24 hours with the refund reference number.');
doc.moveDown(0.3);
doc.text('Step 6: Refund amount appears on the customer statement within 5 to 7 business days depending on the bank.');
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('1.3 Escalation Policy');
doc.fontSize(11).font('Helvetica').text(
  'All refund requests exceeding $500 USD must be escalated to and approved by the Finance Manager ' +
  'before processing. The Finance Manager can be reached at finance-approvals@acmecorp.com. ' +
  'Response time for escalated approvals is 2 business days.'
);
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('1.4 Non-Refundable Items');
doc.fontSize(11).font('Helvetica').text(
  'The following items are NOT eligible for refunds under any circumstances: ' +
  'digital downloads once accessed, customized or personalized products, perishable goods, ' +
  'items marked as Final Sale at the time of purchase, and services already rendered.'
);

// ── Page 3: Employee Onboarding ───────────────────────────────────────────────
doc.addPage();
doc.fontSize(18).font('Helvetica-Bold').text('SECTION 2: EMPLOYEE ONBOARDING');
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica-Bold').text('2.1 First Day Checklist');
doc.fontSize(11).font('Helvetica').text(
  'All new employees must complete the following tasks on their first day of employment at Acme Corporation. ' +
  'Failure to complete any item must be reported to HR immediately.'
);
doc.moveDown(0.3);
doc.text('Task 1: Collect your employee ID badge from the Reception desk located at Building A, Ground Floor. Bring your government-issued photo ID and your offer letter.');
doc.moveDown(0.3);
doc.text('Task 2: Complete I-9 employment verification with the HR team in Room 204. You must bring two forms of identification as listed on the I-9 form.');
doc.moveDown(0.3);
doc.text('Task 3: Sign the Non-Disclosure Agreement and employment contract via DocuSign. A link will be sent to your personal email address on file.');
doc.moveDown(0.3);
doc.text('Task 4: Visit IT Helpdesk in Room 110 to receive your company laptop, mobile phone if applicable, and system credentials including email and VPN access.');
doc.moveDown(0.3);
doc.text('Task 5: Complete the mandatory 2-hour Security Awareness Training available online at training.acmecorp.com. Certificate of completion must be emailed to hr@acmecorp.com.');
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('2.2 First Week Requirements');
doc.fontSize(11).font('Helvetica');
doc.text('By end of Week 1, all new hires must: enroll in payroll at hr.acmecorp.com, set up direct deposit in the payroll system, attend new hire orientation held every Tuesday at 9 AM in Conference Room B, and complete a 30-minute onboarding meeting with their direct manager.');
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('2.3 Probation Period');
doc.fontSize(11).font('Helvetica').text(
  'All new employees are subject to a 90-day probationary period from their start date. ' +
  'Performance reviews are conducted at Day 30, Day 60, and Day 90. ' +
  'Full employee benefits including health insurance, dental, and vision activate only after the ' +
  'successful completion of the 90-day probation period.'
);

// ── Page 4: Expense Reimbursement ─────────────────────────────────────────────
doc.addPage();
doc.fontSize(18).font('Helvetica-Bold').text('SECTION 3: EXPENSE REIMBURSEMENT');
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica-Bold').text('3.1 Eligible Business Expenses');
doc.fontSize(11).font('Helvetica').text(
  'Acme Corporation reimburses employees for the following pre-approved business expenses incurred ' +
  'during the course of official company duties:'
);
doc.moveDown(0.3);
doc.text('Travel: Economy class flights only. Business class requires VP approval. Hotel accommodations are reimbursed up to a maximum of $200 USD per night. Ground transportation including taxis, rideshare, and public transit are fully reimbursable with receipts.');
doc.moveDown(0.3);
doc.text('Meals: Up to $75 USD per day when traveling on company business. Team meals require manager approval in advance and are limited to $50 per person.');
doc.moveDown(0.3);
doc.text('Client Entertainment: Up to $150 USD per person with prior written manager approval. Alcohol is not reimbursable unless part of an approved client entertainment event.');
doc.moveDown(0.3);
doc.text('Office Supplies: Up to $50 USD per month can be claimed without approval. Amounts above $50 require a Purchase Order from the Finance department.');
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('3.2 Submission Process');
doc.fontSize(11).font('Helvetica');
doc.text('Step 1: Collect all original receipts, both paper and digital, for every expense being claimed.');
doc.moveDown(0.3);
doc.text('Step 2: Log all expenses in the Concur expense management system at concur.acmecorp.com within 30 days of the expense date. Expenses older than 30 days will not be reimbursed.');
doc.moveDown(0.3);
doc.text('Step 3: Attach clear scanned copies of all receipts to the corresponding expense line items in Concur.');
doc.moveDown(0.3);
doc.text('Step 4: Submit the completed expense report to your direct manager for approval through the Concur system.');
doc.moveDown(0.3);
doc.text('Step 5: Finance team reviews approved reports and processes reimbursement within 10 business days.');
doc.moveDown(0.3);
doc.text('Step 6: Reimbursement is added to the next regular payroll cycle after Finance approval.');

// ── Page 5: Leave Policy ──────────────────────────────────────────────────────
doc.addPage();
doc.fontSize(18).font('Helvetica-Bold').text('SECTION 4: LEAVE POLICY');
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica-Bold').text('4.1 Annual Leave Entitlement');
doc.fontSize(11).font('Helvetica').text(
  'All full-time employees at Acme Corporation receive 20 days of paid annual leave per calendar year. ' +
  'Leave accrues at a rate of 1.67 days per month starting from the employee hire date. ' +
  'Part-time employees receive a pro-rated leave entitlement based on their contracted hours.'
);
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('4.2 Requesting Annual Leave');
doc.fontSize(11).font('Helvetica');
doc.text('All leave requests must be submitted through the HR portal at hr.acmecorp.com at least 5 business days in advance for leave of 1 to 3 days. Requests for 4 or more consecutive days require a minimum of 2 weeks advance notice. Emergency leave can be approved verbally by the direct manager, followed by formal submission within 24 hours.');
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('4.3 Leave Carryover');
doc.fontSize(11).font('Helvetica').text(
  'Unused annual leave up to a maximum of 5 days may be carried over to the following calendar year. ' +
  'Any unused leave above 5 days will be forfeited at the end of the calendar year on December 31st. ' +
  'Employees are encouraged to plan and use their full leave entitlement each year.'
);
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('4.4 Sick Leave');
doc.fontSize(11).font('Helvetica').text(
  'All employees receive 10 days of paid sick leave per year. Sick leave does not carry over to the ' +
  'following year. A medical certificate from a registered physician is required for any absence ' +
  'exceeding 3 consecutive days. Unused sick leave is not payable upon termination of employment.'
);

// ── Page 6: IT Security ───────────────────────────────────────────────────────
doc.addPage();
doc.fontSize(18).font('Helvetica-Bold').text('SECTION 5: IT SECURITY POLICY');
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica-Bold').text('5.1 Password Requirements');
doc.fontSize(11).font('Helvetica').text(
  'All company system passwords must comply with the following requirements to ensure security: ' +
  'minimum 12 characters in length, must include at least one uppercase letter, one lowercase letter, ' +
  'one number, and one special character such as @, #, $, or %. ' +
  'Passwords must be changed every 90 days and cannot be reused from the previous 10 passwords. ' +
  'Password sharing between employees is strictly prohibited.'
);
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('5.2 Data Classification');
doc.fontSize(11).font('Helvetica');
doc.text('CONFIDENTIAL: Customer personally identifiable information, financial records, employee personal data, and trade secrets. Must be stored encrypted. Cannot be shared outside the company without executive approval.');
doc.moveDown(0.3);
doc.text('INTERNAL: Internal communications, project documentation, meeting notes, and internal reports. Do not share externally. Can be shared between employees on a need-to-know basis.');
doc.moveDown(0.3);
doc.text('PUBLIC: Marketing materials, published press releases, annual reports, and product documentation. No access restrictions. Can be shared freely.');
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').text('5.3 Security Incident Reporting');
doc.fontSize(11).font('Helvetica').text(
  'All suspected or confirmed security incidents including data breaches, unauthorized access, ' +
  'phishing attempts, or lost devices must be reported to the IT Security team at security@acmecorp.com ' +
  'within 1 hour of discovery. Do not attempt to investigate or remediate incidents independently. ' +
  'Preserve all logs, emails, and evidence before reporting. Failure to report incidents promptly ' +
  'may result in disciplinary action.'
);

doc.end();

doc.on('finish', () => {
  const stats = fs.statSync(outputPath);
  console.log('✅ Test PDF created:', outputPath);
  console.log('   File size:', (stats.size / 1024).toFixed(1), 'KB');
  console.log('   Pages: 6');
  console.log('   Expected chunks: 20-30');
  console.log('\nNow upload it:');
  console.log('curl.exe -X POST http://localhost:5000/api/upload -H "x-admin-key: supersecretadminkey123" -F "pdf=@scripts/test-sop.pdf"');
});

doc.on('error', (err) => {
  console.error('❌ PDF creation failed:', err.message);
});