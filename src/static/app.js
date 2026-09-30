document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(message, type) {
    clearTimeout(messageTimeout);
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function unregisterParticipant(activity, participant, button) {
    button.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(participant)}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "An error occurred", "error");
        button.disabled = false;
        return;
      }

      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      button.disabled = false;
      console.error("Error unregistering participant:", error);
    }
  }

  function createParticipantsSection(activity, participants) {
    const section = document.createElement("div");
    section.className = "participants-section";

    const heading = document.createElement("h5");
    heading.textContent = `Participants (${participants.length})`;
    section.appendChild(heading);

    if (participants.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "participants-empty";
      emptyMessage.textContent = "Be the first to sign up!";
      section.appendChild(emptyMessage);
      return section;
    }

    const list = document.createElement("ul");
    list.className = "participants-list";

    participants.forEach((participant) => {
      const listItem = document.createElement("li");

      const participantEmail = document.createElement("span");
      participantEmail.textContent = participant;
      listItem.appendChild(participantEmail);

      const deleteButton = document.createElement("button");
      deleteButton.className = "participant-delete-button";
      deleteButton.type = "button";
      deleteButton.title = "Unregister participant";
      deleteButton.setAttribute(
        "aria-label",
        `Unregister ${participant} from ${activity}`
      );
      deleteButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"></path>
        </svg>
      `;
      deleteButton.addEventListener("click", () => {
        unregisterParticipant(activity, participant, deleteButton);
      });
      listItem.appendChild(deleteButton);

      list.appendChild(listItem);
    });

    section.appendChild(list);
    return section;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }

      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(createParticipantsSection(name, details.participants));
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
