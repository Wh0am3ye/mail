document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Show location in URL
  window.onpopstate = function(event) {
    load_mailbox(event.state.mailbox);
  };

  // Get mailbox for URL
  document.querySelectorAll('button').forEach(button => {
    button.onclick = function() {
        const mailbox = this.dataset.mailbox;
        history.pushState({mailbox: mailbox}, "", `${mailbox}`);
        // load_mailbox(mailbox);
    };
  });

  // Send email
  document.querySelector('#send-email').onclick = () => {
    send_email();
    return false;
  };
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  document.getElementById(`${mailbox}`).focus();

  // Fetch emails for mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emails.forEach( email => {
      const emailDetails = document.createElement('div');
      emailDetails.innerHTML = `
                  <b>Sender:</b> <span class="email-sender">${email.sender}</span> &emsp;
                  <b>Subject:</b> <span class="email-subject">${email.subject}</span>
                  <span class="email-timestamp">${email.timestamp}</span>`;
      emailDetails.className = 'email';
      if (email.read == true) {
        emailDetails.style.backgroundColor = 'lightgray';
      };
      document.querySelector('#emails-view').append(emailDetails);
      emailDetails.addEventListener('click', () => {
        view_email(`${email.id}`);
      });
    });
  })
  .catch(error => {
    console.log('Error:', error);
  });

  return false;
}

function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(mail => {
    console.log(mail);

    // Show the email and hide other views
    document.querySelector('#mail-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#mail-view').innerHTML = "";

    // Display email
    const email = document.createElement('div');
    email.innerHTML = `
          <b>Sender:</b> ${mail.sender}<br>
          <b>Recipients:</b> ${mail.recipients}<br>
          <b>Subject:</b> ${mail.subject}<br>
          <b>Time:</b> ${mail.timestamp}<br>
          <b>Message:</b><br>
          &emsp;${mail.body}<br>`
    document.querySelector('#mail-view').append(email);
    mark_read(mail.id);
  })
  .catch(error => {
    console.log('Error:', error);
  });
}

function send_email() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        load_mailbox('sent')
    });
    return false;
}

function mark_read(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    }),
  });
}

function mark_archived(id) {
  pass
}

