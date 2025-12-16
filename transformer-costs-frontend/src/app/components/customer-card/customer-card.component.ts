import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CustomerCardService } from './customer-card.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

interface CustomerCard {
  No: string;
  Name: string;
  County: string;
  Responsibility_Center: string;
  Customer_Status: string;
  VAT_Registration_No: string;
  Last_Date_Modified?: string;
}

@Component({
  selector: 'app-customer-card',
  templateUrl: './customer-card.component.html',
  styleUrls: ['./customer-card.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class CustomerCardComponent implements OnInit {
  customerCards: CustomerCard[] = [];
  filteredCustomers: CustomerCard[] = [];
  selectedCustomer: CustomerCard | null = null;
  searchText: string = '';
  searchColumn: string = 'Name';
  isLoading: boolean = false;
  showTable: boolean = true;
  showCustomerDetails: boolean = false;
  isCreatingNewCustomer: boolean = false;
  noCustomerFound: boolean = false;
  successMessage: string = '';
  showNoCustomerMessage = false;

  newCustomer: CustomerCard = {
    No: '',
    Name: '',
    County: '',
    Responsibility_Center: '',
    Customer_Status: '',
    VAT_Registration_No: '',
    Last_Date_Modified: '',
  };

  constructor(
    private customerCardService: CustomerCardService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadCustomerCards();
  }

  loadCustomerCards(): void {
    this.isLoading = true;
    this.showNoCustomerMessage = false;

    this.customerCardService.getCustomerCards().subscribe(
      (data: CustomerCard[]) => {
        this.customerCards = data ?? [];
        this.filteredCustomers = this.customerCards;
        this.isLoading = false;

        setTimeout(() => {
          if (!this.isLoading && this.filteredCustomers.length === 0) {
            this.showNoCustomerMessage = true;
          }
        }, 30000);
      },
      (error) => {
        console.error(
          'Erreur lors de la récupération des Customer Cards:',
          error
        );
        this.isLoading = false;
        this.showNoCustomerMessage = true;
      }
    );
  }

  searchCustomers(): void {
    if (this.searchText) {
      this.filteredCustomers = this.customerCards.filter((customer) => {
        const value = customer[this.searchColumn as keyof CustomerCard];
        return (
          typeof value === 'string' &&
          value.toLowerCase().includes(this.searchText.toLowerCase())
        );
      });
    } else {
      this.filteredCustomers = this.customerCards;
    }

    this.noCustomerFound = this.filteredCustomers.length === 0;
  }

  onSelectCustomer(customer: CustomerCard): void {
    if (this.selectedCustomer?.No === customer.No) {
      this.selectedCustomer = null;
      this.showTable = true;
      this.showCustomerDetails = false;
    } else {
      this.selectedCustomer = customer;
      this.showTable = false;
      this.showCustomerDetails = true;
    }
  }

  goToRequestManagement(): void {
    if (!this.selectedCustomer) return;
    this.router.navigate(['/gestion-demande'], {
      queryParams: {
        customerNo: this.selectedCustomer.No,
        customerName: this.selectedCustomer.Name,
      },
    });
  }

  createNewCustomer(): void {
    this.isCreatingNewCustomer = true;
    this.showTable = false;
  }

  cancelNewCustomer(): void {
    this.isCreatingNewCustomer = false;
    this.showTable = true;
  }

  saveNewCustomer(): void {
    if (this.newCustomer.Name && this.newCustomer.No) {
      const payload = {
        No: this.newCustomer.No,
        Name: this.newCustomer.Name,
        County: this.newCustomer.County,
        Responsibility_Center: this.newCustomer.Responsibility_Center,
        Customer_Status: this.newCustomer.Customer_Status,
        VAT_Registration_No: this.newCustomer.VAT_Registration_No,
      };
      if (this.selectedCustomer) {
        this.customerCardService.updateCustomer(payload).subscribe(
          (updatedCustomer) => {
            const index = this.customerCards.findIndex(
              (c) => c.No === updatedCustomer.No
            );
            if (index !== -1) {
              this.customerCards[index] = updatedCustomer;
            }
            this.filteredCustomers = [...this.customerCards];

            this.successMessage = '✅ Client modifié avec succès !';
            setTimeout(() => {
              this.successMessage = '';
              this.resetSelection();
            }, 3000);
          },
          (error) => {
            console.error('Erreur lors de la modification du client:', error);
          }
        );
      } else {
        this.customerCardService.addCustomer(payload).subscribe(
          (addedCustomer) => {
            this.customerCards.push(addedCustomer);
            this.filteredCustomers = [...this.customerCards];

            this.successMessage = '✅ Client ajouté avec succès !';
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);

            this.resetSelection();
          },
          (error) => {
            console.error("Erreur lors de l'ajout du client:", error);
          }
        );
      }
    }
  }

  deleteCustomer(customerNo: string): void {
    if (!confirm('❗ Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    this.customerCardService.deleteCustomer(customerNo).subscribe(
      () => {
        this.customerCards = this.customerCards.filter(
          (customer) => customer.No !== customerNo
        );
        this.filteredCustomers = [...this.customerCards];
        this.successMessage = '❌ Client supprimé avec succès !';
        setTimeout(() => {
          this.successMessage = '';
          this.resetSelection();
        }, 3000);
      },
      (error) => {
        console.error('❌ Erreur lors de la suppression du client:', error);
      }
    );
  }

  editCustomer(customer: CustomerCard): void {
    this.newCustomer = { ...customer };
    this.isCreatingNewCustomer = true;
    this.showTable = false;
    this.selectedCustomer = customer;
  }

  saveEditedCustomer(): void {
    if (!this.selectedCustomer) return;
    this.customerCardService.updateCustomer(this.selectedCustomer).subscribe(
      (updatedCustomer) => {
        const index = this.customerCards.findIndex(
          (c) => c.No === updatedCustomer.No
        );
        if (index !== -1) {
          this.customerCards[index] = updatedCustomer;
        }
        this.filteredCustomers = [...this.customerCards];
        this.successMessage = '✅ Client modifié avec succès !';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);

        this.resetSelection();
      },
      (error) => {
        console.error('❌ Erreur lors de la modification du client:', error);
      }
    );
  }

  resetSelection(): void {
    this.selectedCustomer = null;
    this.isCreatingNewCustomer = false;
    this.showTable = true;
    this.showCustomerDetails = false;
  }
  customerRequests: any[] = [];

  viewCustomerRequests(customerNo: string): void {
    if (!customerNo) {
      console.error('❌ Aucun client sélectionné.');
      return;
    }

    const trimmedNo = customerNo.trim();
    console.log(
      `📤 Navigation vers l'historique des demandes du client No=${JSON.stringify(
        trimmedNo
      )}`
    );

    this.router.navigate(['/historique-demandes'], {
      queryParams: { customerNo: trimmedNo },
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.location.back();
    }
  }
  customersPerPage = 10;
  currentPage = 1;

  get paginatedCustomers() {
    const start = (this.currentPage - 1) * this.customersPerPage;
    const end = start + this.customersPerPage;
    return this.filteredCustomers.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredCustomers.length / this.customersPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }
}
