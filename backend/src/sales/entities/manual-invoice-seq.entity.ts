import { Column, Entity, PrimaryColumn } from 'typeorm';

// Yearly counter for manually created sales invoices (synced Peachtree
// invoices keep their own numbers; only createOrder consumes this).
@Entity('manual_invoice_seq')
export class ManualInvoiceSeq {
  @PrimaryColumn({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 0 })
  last_no: number;
}
