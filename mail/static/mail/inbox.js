document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
  history.pushState('inbox', '', 'inbox');

  // Get mailbox for URL
  document.querySelectorAll('.navi').forEach(button => {
    button.onclick = function() {
      const mailbox = this.dataset.mailbox;
      history.pushState({mailbox: mailbox}, '', `${mailbox}`);
    };
  });

  // Show location in URL
  window.onpopstate = function(event) {
    load_mailbox(event.state.mailbox);
  };

  // Send email
  document.querySelector('#send-email').onclick = () => {
    send_email();
    return false;
  };
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Fetch emails for mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#mail-view').style.display = 'none';
    document.querySelector('#emails-view').innerHTML = '';
    
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
    // Focus the mailbox button
    document.getElementById(`${mailbox}`).focus();

    // Iterate emails and display list
    emails.forEach( email => {
      const emailDetails = document.createElement('div');
      emailDetails.innerHTML = `
                  <span class="email-sender">${email.sender}</span> &emsp;
                  <b>Subject:</b> <span class="email-subject">${email.subject}</span>
                  <span class="email-timestamp">${email.timestamp}</span>`;
      emailDetails.className = 'email';
      if (email.read == true) {
        emailDetails.style.backgroundColor = 'lightgray';
      };
      document.querySelector('#emails-view').append(emailDetails);

      // Open email to read content
      emailDetails.addEventListener('click', () => {
        view_email(`${email.id}`, mailbox);
      });
    });
  })
  .catch(error => {
    console.log('Error:', error);
  });

  return false;
}

function view_email(id, mailbox) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(mail => {
    console.log(mail);

    // Show the email and hide other views
    document.querySelector('#mail-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-area').innerHTML = '';

    // Display email
    const email = document.createElement('div');
    email.innerHTML = `
          <b>Sender:</b> ${mail.sender}<br>
          <b>Recipients:</b> ${mail.recipients}<br>
          <b>Subject:</b> ${mail.subject}<br>
          <b>Time:</b> ${mail.timestamp}<br>
          <b>Message:</b><br>
          &emsp;${mail.body}<br>`;
    document.querySelector('#email-area').append(email);

    // Hide archive button for sent emails
    if (mailbox == 'sent') {
      document.getElementById('archive').style.display = 'none';
    } else {
      document.getElementById('archive').style.display = 'inline-block';
    };

    // Mark email as read
    mark_read(mail.id);

    // Reply set-up & listener for replying
    const sender = mail.sender;
    const subject = mail.subject;
    const timestamp = mail.timestamp;
    const body = mail.body;
    document.querySelector('#reply').addEventListener('click', () => {
      reply(sender, subject, timestamp, body);
    });

    // Change text on archive button - Archive/Unarchive
    if (mail.archived == true) {
      document.getElementById('archive').innerHTML = 'Unarchive';
    } else if (mail.archived == false) {
      document.getElementById('archive').innerHTML = 'Archive';
    };

    // Listener for archiving
    document.querySelector('#archive').addEventListener('click', () => {
      if (mail.archived == false) {
        archive(mail.id);
      } else if (mail.archived == true) {
        unarchive(mail.id);
      };
      load_mailbox('inbox');
      history.pushState('inbox', '', 'inbox');
    });

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
      }),
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        load_mailbox('sent');
        history.pushState('sent', '', 'sent');
    });
    return false;
}

function mark_read(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    }),
  });
}

function archive(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    }),
  })
}

function unarchive(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    }),
  })
}

function reply(sender, subject, timestamp, body) {
  compose_email();
  // Pre-fill composition fields
  document.querySelector('#compose-recipients').value = `${sender}`;
  if (subject.startsWith('Re:') == true ) {
    document.querySelector('#compose-subject').value = `${subject}`;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
  };
  document.querySelector('#compose-body').focus();
  document.querySelector('#compose-body').value = `\rOn ${timestamp}, ${sender} wrote:\r${body}`;
}
