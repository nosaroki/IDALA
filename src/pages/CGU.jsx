import { useContext } from 'react'
import { Helmet } from 'react-helmet-async'
import { LangCtx } from '../components/LangContext'
import Footer from '../components/Footer'

export default function CGU() {
  const { lang } = useContext(LangCtx)

  return (
    <>
      <Helmet>
        <title>{lang === 'fr' ? "Conditions Générales d'Utilisation : The Idala Family" : 'Terms of Use : The Idala Family'}</title>
        <meta name="description" content={lang === 'fr'
          ? "Conditions générales d'utilisation de la plateforme The Idala Family."
          : 'Terms of use of The Idala Family platform.'} />
      </Helmet>

      <div className="legal-page">
        <header className="legal-hero">
          <p className="legal-hero__eyebrow">{lang === 'fr' ? 'Informations légales' : 'Legal'}</p>
          <h1 className="legal-hero__title">
            {lang === 'fr' ? "Conditions Générales d'Utilisation" : 'Terms of Use'}
          </h1>
          <p className="legal-hero__update">
            {lang === 'fr' ? 'Dernière mise à jour : juin 2026' : 'Last updated: June 2026'}
          </p>
        </header>

        <div className="legal-content">

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 1 : Définitions' : 'Article 1 : Definitions'}</h2>
            <p>{lang === 'fr'
              ? "Au sens des présentes, les termes ci-après ont la signification suivante :"
              : 'For the purposes hereof, the following terms have the meaning set out below:'}</p>
            <ul className="legal-defs">
              <li><strong>« IDALA »</strong> : {lang === 'fr'
                ? "Madame Diane Thomas, entrepreneur individuel exerçant sous le nom commercial « The IDALA Family », immatriculée au Registre national des entreprises sous le numéro SIREN 918 623 265, domiciliée au 15 boulevard de la Saussaye, 92200 Neuilly-sur-Seine, exploitant la Plateforme."
                : 'Ms Diane Thomas, sole trader operating under the trade name "The IDALA Family", registered with the National Business Register under SIREN number 918 623 265, domiciled at 15 boulevard de la Saussaye, 92200 Neuilly-sur-Seine, operating the Platform.'}</li>
              <li><strong>« {lang === 'fr' ? 'Plateforme' : 'Platform'} »</strong> : {lang === 'fr'
                ? "le site internet et l'application mobile (le cas échéant) exploités sous la marque THE IDALA FAMILY, permettant la mise en relation entre Praticiens et Utilisateurs."
                : 'the website and mobile application (where applicable) operated under the THE IDALA FAMILY brand, connecting Practitioners and Users.'}</li>
              <li><strong>« {lang === 'fr' ? 'Compte' : 'Account'} »</strong> : {lang === 'fr'
                ? "l'espace numérique personnel et individualisé de l'Utilisateur sur la Plateforme."
                : "the User's personal and individual digital space on the Platform."}</li>
              <li><strong>« CGU »</strong> : {lang === 'fr'
                ? "les présentes conditions générales d'utilisation, opposables à l'Utilisateur."
                : 'these terms of use, enforceable against the User.'}</li>
              <li><strong>« {lang === 'fr' ? 'Convention' : 'Agreement'} »</strong> : {lang === 'fr'
                ? "la Convention de Référencement et de Partenariat conclue entre IDALA et le Praticien."
                : 'the Listing and Partnership Agreement concluded between IDALA and the Practitioner.'}</li>
              <li><strong>« {lang === 'fr' ? 'Praticien' : 'Practitioner'} »</strong> : {lang === 'fr'
                ? "tout professionnel indépendant du bien-être référencé sur la Plateforme après validation de son dossier par IDALA."
                : 'any independent wellness professional listed on the Platform after validation of their application by IDALA.'}</li>
              <li><strong>« {lang === 'fr' ? 'Utilisateur' : 'User'} »</strong> : {lang === 'fr'
                ? "toute personne physique ou morale accédant à la Plateforme aux fins de rechercher et réserver une Prestation auprès d'un Praticien."
                : 'any natural or legal person accessing the Platform to search for and book a Service from a Practitioner.'}</li>
              <li><strong>« {lang === 'fr' ? 'Prestation' : 'Service'} »</strong> : {lang === 'fr'
                ? "tout service d'accompagnement bien-être, développement personnel, pratiques énergétiques, conseil ou autre discipline proposée par le Praticien via la Plateforme, dispensé en présentiel ou à distance."
                : 'any wellness support, personal development, energy practice, advisory or other discipline offered by the Practitioner via the Platform, provided in person or remotely.'}</li>
              <li><strong>« {lang === 'fr' ? 'Contrat de Prestation' : 'Service Contract'} »</strong> : {lang === 'fr'
                ? "le contrat conclu directement entre l'Utilisateur et le Praticien pour la réalisation d'une Prestation, auquel IDALA n'est pas partie."
                : 'the contract concluded directly between the User and the Practitioner for the performance of a Service, to which IDALA is not a party.'}</li>
              <li><strong>« {lang === 'fr' ? 'Réservation confirmée' : 'Confirmed Booking'} »</strong> : {lang === 'fr'
                ? "toute Prestation pour laquelle un Utilisateur a finalisé une réservation sur la Plateforme, ayant donné lieu à une confirmation de paiement par Stripe."
                : 'any Service for which a User has finalised a booking on the Platform, giving rise to a payment confirmation by Stripe.'}</li>
              <li><strong>« Stripe »</strong> : {lang === 'fr'
                ? "la société Stripe Technology Europe, Limited, prestataire de services de paiement agréé, chargée du traitement des flux financiers via Stripe Connect."
                : 'Stripe Technology Europe, Limited, an authorised payment services provider, responsible for processing financial flows via Stripe Connect.'}</li>
              <li><strong>« {lang === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'} »</strong> : {lang === 'fr'
                ? "la politique accessible sur la Plateforme décrivant le traitement des données personnelles des Utilisateurs."
                : "the policy available on the Platform describing the processing of Users' personal data."}</li>
            </ul>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 2 : Objet' : 'Article 2 : Purpose'}</h2>
            <p>{lang === 'fr'
              ? "Les présentes CGU définissent les modalités d'accès et d'utilisation de la Plateforme, exploitée par IDALA."
              : 'These Terms define the conditions of access to and use of the Platform operated by IDALA.'}</p>
            <p>{lang === 'fr'
              ? "Les CGU ne régissent pas le Contrat de Prestation conclu entre l'Utilisateur et le Praticien. IDALA intervient exclusivement comme intermédiaire de mise en relation : elle n'est ni partie à ce contrat, ni responsable de la réalisation des Prestations."
              : 'The Terms do not govern the Service Contract concluded between the User and the Practitioner. IDALA acts solely as an intermediary: it is neither a party to that contract nor responsible for the performance of the Services.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 3 : Compte et acceptation des CGU' : 'Article 3 : Account and acceptance'}</h2>
            <p>{lang === 'fr'
              ? "L'utilisation de la Plateforme suppose la création d'un Compte et l'acceptation des CGU, matérialisée par une case à cocher préalablement à toute Réservation. Les CGU sont mises à la disposition de l'Utilisateur et accessibles à tout moment sur la Plateforme, préalablement à toute Réservation. Toute utilisation de la Plateforme et toute Réservation d'une Prestation emportent adhésion pleine et entière de l'Utilisateur aux CGU et engagement de les respecter. L'Utilisateur reconnaît avoir pris connaissance des CGU avant de valider sa Réservation, la validation de la Réservation valant acceptation des CGU. L'Utilisateur garantit l'exactitude des informations communiquées."
              : "Use of the Platform requires the creation of an Account and acceptance of the Terms, evidenced by a checkbox prior to any Booking. The Terms are made available to the User and accessible at any time on the Platform, prior to any Booking. Any use of the Platform and any Booking of a Service constitutes the User's full acceptance of the Terms and undertaking to comply with them. The User acknowledges having read the Terms before validating their Booking, validation of the Booking constituting acceptance of the Terms. The User guarantees the accuracy of the information provided."}</p>
            <p>{lang === 'fr'
              ? "L'Utilisateur est responsable de la confidentialité de ses identifiants et de toute opération réalisée depuis son Compte. Il notifie sans délai à IDALA toute perte, vol ou usage non autorisé de ses identifiants ; IDALA peut alors prendre toute mesure de sécurisation appropriée."
              : 'The User is responsible for keeping their credentials confidential and for any operation carried out from their Account. They shall notify IDALA without delay of any loss, theft or unauthorised use of their credentials; IDALA may then take any appropriate security measure.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 4 : Réservation et classement des Praticiens' : 'Article 4 : Booking and ranking of Practitioners'}</h2>
            <p>{lang === 'fr'
              ? "L'Utilisateur sélectionne une Prestation, une date et une heure parmi les disponibilités affichées. Avant validation, un récapitulatif (Prestation, Praticien, date, prix TTC) lui est présenté. La Réservation est confirmée dès acceptation par le Praticien et confirmation du paiement par Stripe."
              : 'The User selects a Service, date and time from the available slots. Before validation, a summary (Service, Practitioner, date, price incl. VAT) is presented. The Booking is confirmed upon acceptance by the Practitioner and payment confirmation by Stripe.'}</p>
            <p>{lang === 'fr'
              ? "L'Utilisateur est informé que les Praticiens lui sont présentés selon un classement reposant principalement sur la pertinence au regard de sa recherche, la localisation et les disponibilités."
              : 'The User is informed that Practitioners are presented according to a ranking based mainly on relevance to their search, location and availability.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 5 : Prix et paiement' : 'Article 5 : Price and payment'}</h2>
            <p>{lang === 'fr'
              ? "Le prix de la Prestation est celui affiché TTC sur la Plateforme au moment de la Réservation. Le paiement s'effectue exclusivement par carte bancaire via Stripe Connect."
              : 'The price of the Service is the one displayed incl. VAT on the Platform at the time of Booking. Payment is made exclusively by bank card via Stripe Connect.'}</p>
            <p>{lang === 'fr'
              ? "IDALA ne détient ni ne manie à aucun moment les fonds : le paiement est encaissé directement par le Praticien, sur son Compte Stripe Connect, qui en est le seul bénéficiaire. Le Contrat de Prestation est conclu entre l'Utilisateur et le Praticien ; IDALA, tiers à ce Contrat de Prestation, n'encaisse pas le prix de la Prestation."
              : "IDALA never holds or handles the funds: payment is collected directly by the Practitioner, on their Stripe Connect Account, who is the sole beneficiary. The Service Contract is concluded between the User and the Practitioner; IDALA, a third party to that Service Contract, does not collect the price of the Service."}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 6 : Droit de rétractation' : 'Article 6 : Right of withdrawal'}</h2>
            <p>{lang === 'fr'
              ? "Lorsque la Réservation est effectuée plus de quatorze (14) jours avant la date de la Prestation, l'Utilisateur consommateur dispose d'un délai de quatorze (14) jours pour exercer son droit de rétractation, sans frais ni motif. Il l'exerce au moyen de la fonctionnalité dédiée de la Plateforme ou du formulaire figurant ci-dessous à adresser par courriel ; la Réservation est alors annulée sans frais."
              : 'Where the Booking is made more than fourteen (14) days before the date of the Service, the consumer User has a period of fourteen (14) days to exercise their right of withdrawal, free of charge and without reason. This is exercised via the dedicated feature of the Platform or the form below to be sent by email; the Booking is then cancelled free of charge.'}</p>
            <p>{lang === 'fr'
              ? "Lorsque la Réservation est effectuée moins de quatorze (14) jours avant la date de la Prestation, l'Utilisateur, en validant sa Réservation, demande expressément que la Prestation soit exécutée avant la fin du délai de rétractation et reconnaît qu'il perdra son droit de rétractation une fois la Prestation pleinement exécutée. Les conditions d'annulation de l'Article 7 s'appliquent alors."
              : 'Where the Booking is made less than fourteen (14) days before the date of the Service, the User, by validating their Booking, expressly requests that the Service be performed before the end of the withdrawal period and acknowledges that they will lose their right of withdrawal once the Service has been fully performed. The cancellation conditions of Article 7 then apply.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 7 : Annulation' : 'Article 7 : Cancellation'}</h2>
            <h3>{lang === 'fr' ? "7.1 Annulation par l'Utilisateur" : '7.1 Cancellation by the User'}</h3>
            <ul>
              <li>{lang === 'fr'
                ? "Annulation plus de 24 heures avant l'heure prévue de la Prestation : aucun prélèvement ; toute somme déjà capturée est intégralement remboursée."
                : 'Cancellation more than 24 hours before the scheduled time of the Service: no charge; any amount already captured is refunded in full.'}</li>
              <li>{lang === 'fr'
                ? "Annulation moins de 24 heures avant l'heure prévue, ou absence de l'Utilisateur : la Prestation est due et facturée à 100 %, sans remboursement."
                : 'Cancellation less than 24 hours before the scheduled time, or User no-show: the Service is due and charged at 100%, without refund.'}</li>
            </ul>
            <h3>{lang === 'fr' ? '7.2 Annulation par le Praticien' : '7.2 Cancellation by the Practitioner'}</h3>
            <p>{lang === 'fr'
              ? "En cas d'annulation du fait du Praticien, l'Utilisateur est intégralement remboursé des sommes versées au titre de la Prestation annulée et ne supporte aucun frais."
              : 'In the event of cancellation by the Practitioner, the User is fully refunded the amounts paid for the cancelled Service and bears no cost.'}</p>
            <h3>{lang === 'fr' ? '7.3 Remboursements' : '7.3 Refunds'}</h3>
            <p>{lang === 'fr'
              ? "Tout remboursement est débité directement du compte du Praticien via Stripe, IDALA n'intervenant pas dans les flux financiers. Le crédit effectif sur le compte de l'Utilisateur intervient selon les délais propres à Stripe et à l'établissement bancaire de l'Utilisateur (à titre indicatif, cinq à dix jours ouvrés)."
              : "Any refund is debited directly from the Practitioner's account via Stripe, IDALA not intervening in the financial flows. The actual credit to the User's account occurs according to the timeframes specific to Stripe and the User's bank (as a guide, five to ten business days)."}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? "Article 8 : Engagements de l'Utilisateur" : 'Article 8 : User undertakings'}</h2>
            <p>{lang === 'fr' ? "L'Utilisateur s'engage à :" : 'The User undertakes to:'}</p>
            <ul>
              <li>{lang === 'fr' ? 'fournir des informations exactes et à jour ;' : 'provide accurate and up-to-date information;'}</li>
              <li>{lang === 'fr' ? 'faire un usage loyal de la Plateforme ;' : 'make fair use of the Platform;'}</li>
              <li>{lang === 'fr' ? 'adopter un comportement correct envers le Praticien ;' : 'behave appropriately towards the Practitioner;'}</li>
              <li>{lang === 'fr' ? 'ne pas publier de contenu illicite, diffamant, injurieux ou dénigrant ;' : 'not publish unlawful, defamatory, insulting or disparaging content;'}</li>
              <li>{lang === 'fr' ? "ne pas solliciter un Praticien en vue de réaliser une Prestation en dehors de la Plateforme à la suite d'une mise en relation." : 'not solicit a Practitioner to perform a Service outside the Platform following an introduction.'}</li>
            </ul>
            <p>{lang === 'fr'
              ? "Sont strictement interdits : toute fraude ou usurpation d'identité, toute intrusion ou tentative d'intrusion dans les systèmes d'IDALA, et tout comportement de nature à perturber le fonctionnement de la Plateforme."
              : "Strictly prohibited are: any fraud or identity theft, any intrusion or attempted intrusion into IDALA's systems, and any behaviour likely to disrupt the operation of the Platform."}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 9 : Rôle et responsabilité de la Plateforme' : 'Article 9 : Role and liability of the Platform'}</h2>
            <p>{lang === 'fr'
              ? "IDALA fournit un service d'intermédiation et de mise en relation. Elle n'exerce aucun contrôle sur la réalisation des Prestations, dont le Praticien est seul responsable. La responsabilité d'IDALA est limitée à son rôle d'opérateur de plateforme et aux préjudices certains, directs et prévisibles résultant d'un manquement qui lui serait directement imputable."
              : "IDALA provides an intermediation and introduction service. It exercises no control over the performance of the Services, for which the Practitioner is solely responsible. IDALA's liability is limited to its role as platform operator and to certain, direct and foreseeable damage resulting from a breach directly attributable to it."}</p>
            <p>{lang === 'fr'
              ? "IDALA ne propose aucun dispositif d'indemnisation au bénéfice de l'Utilisateur au titre des Prestations. Tout dommage matériel ou immatériel survenu à l'occasion d'une Prestation relève de la seule responsabilité du Praticien et, le cas échéant, de son assurance responsabilité civile professionnelle. IDALA, tiers au Contrat de Prestation, ne saurait être tenue d'aucune indemnisation à ce titre."
              : "IDALA offers no compensation scheme for the benefit of the User in respect of the Services. Any material or immaterial damage occurring during a Service is the sole responsibility of the Practitioner and, where applicable, their professional liability insurance. IDALA, a third party to the Service Contract, cannot be held liable for any compensation in this respect."}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 10 : Avis et notation' : 'Article 10 : Reviews and ratings'}</h2>
            <p>{lang === 'fr'
              ? "À l'issue d'une Prestation, l'Utilisateur peut évaluer le Praticien. IDALA peut modérer tout contenu manifestement illicite ou contraire aux CGU."
              : 'After a Service, the User may rate the Practitioner. IDALA may moderate any content that is manifestly unlawful or contrary to the Terms.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 11 : Données personnelles' : 'Article 11 : Personal data'}</h2>
            <p>{lang === 'fr'
              ? "IDALA, responsable de traitement, traite les données personnelles des Utilisateurs dans le respect du Règlement (UE) 2016/679 (RGPD) et de la loi Informatique et Libertés."
              : 'IDALA, as data controller, processes Users personal data in compliance with Regulation (EU) 2016/679 (GDPR) and the French Data Protection Act.'}</p>
            <p>{lang === 'fr'
              ? "Ces données sont traitées aux fins de création et de gestion du Compte, de traitement des Réservations et des paiements, de la relation avec l'Utilisateur et du respect des obligations légales d'IDALA. Les bases légales sont l'exécution des CGU et du Contrat de Prestation, le respect d'obligations légales et l'intérêt légitime d'IDALA."
              : "This data is processed for the purposes of creating and managing the Account, processing Bookings and payments, the relationship with the User and compliance with IDALA's legal obligations. The legal bases are the performance of the Terms and the Service Contract, compliance with legal obligations and IDALA's legitimate interest."}</p>
            <p>{lang === 'fr'
              ? "Les données sont susceptibles d'être communiquées au Praticien concerné (pour la réalisation de la Prestation), à Stripe (traitement des paiements) et aux sous-traitants techniques d'IDALA. Elles sont conservées pour la durée nécessaire à ces finalités et aux obligations légales applicables."
              : "The data may be shared with the relevant Practitioner (for the performance of the Service), with Stripe (payment processing) and with IDALA's technical subcontractors. It is kept for the period necessary for these purposes and applicable legal obligations."}</p>
            <p>{lang === 'fr'
              ? "L'Utilisateur dispose des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, qu'il exerce auprès de Madame Diane Thomas : contact@theidalafamily.com. Il peut introduire une réclamation auprès de la CNIL. Le cas échéant, une Politique de confidentialité accessible sur la Plateforme précise ces traitements."
              : 'The User has rights of access, rectification, erasure, restriction, objection and portability, exercised with Ms Diane Thomas: contact@theidalafamily.com. They may lodge a complaint with the CNIL. Where applicable, a Privacy Policy available on the Platform details these processing activities.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 12 : Réclamations et médiation de la consommation' : 'Article 12 : Complaints and consumer mediation'}</h2>
            <p>{lang === 'fr'
              ? "Toute réclamation est adressée à Madame Diane Thomas par email : contact@theidalafamily.com, ou par courrier : 15 boulevard de la Saussaye, 92200 Neuilly-sur-Seine. Conformément aux articles L. 611-1 et suivants du Code de la consommation, l'Utilisateur consommateur peut, après tentative de résolution amiable directe, recourir gratuitement au médiateur de la consommation dont relève IDALA :"
              : 'Any complaint is addressed to Ms Diane Thomas by email: contact@theidalafamily.com, or by post: 15 boulevard de la Saussaye, 92200 Neuilly-sur-Seine. In accordance with Articles L. 611-1 et seq. of the Consumer Code, the consumer User may, after attempting direct amicable resolution, use free of charge the consumer mediator for IDALA:'}</p>
            <p className="legal-mediator">
              MÉDIATION CONSOMMATION DÉVELOPPEMENT (MCD)<br/>
              Centre d'Affaires Stéphanois : Immeuble l'Horizon<br/>
              Esplanade de France, 3 rue J. Constant Milleret, 42000 Saint-Étienne.<br/>
              {lang === 'fr' ? 'Site internet (saisine en ligne) : ' : 'Website (online referral): '}
              <a href="https://www.medconsodev.eu" target="_blank" rel="noopener noreferrer">www.medconsodev.eu</a>
            </p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 13 : Propriété intellectuelle' : 'Article 13 : Intellectual property'}</h2>
            <p>{lang === 'fr'
              ? "La Plateforme et l'ensemble de ses éléments (marque, logiciels, bases de données, contenus, visuels) sont la propriété exclusive d'IDALA. Toute reproduction ou représentation, totale ou partielle, sans autorisation préalable, est interdite."
              : 'The Platform and all its elements (brand, software, databases, content, visuals) are the exclusive property of IDALA. Any reproduction or representation, in whole or in part, without prior authorisation, is prohibited.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 14 : Relation avec le Praticien' : 'Article 14 : Relationship with the Practitioner'}</h2>
            <p>{lang === 'fr'
              ? "La relation entre IDALA et le Praticien est régie par la Convention de Référencement et de Partenariat, que les présentes CGU complètent. En cas de divergence, les CGU prévalent pour tout ce qui relève du fonctionnement de la Plateforme."
              : 'The relationship between IDALA and the Practitioner is governed by the Listing and Partnership Agreement, which these Terms supplement. In the event of a discrepancy, the Terms prevail for everything relating to the operation of the Platform.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 15 : Durée et modification des CGU' : 'Article 15 : Duration and amendment'}</h2>
            <p>{lang === 'fr'
              ? "15.1 Les CGU sont conclues pour une durée indéterminée et entrent en vigueur à leur acceptation."
              : '15.1 The Terms are concluded for an indefinite period and take effect upon acceptance.'}</p>
            <p>{lang === 'fr'
              ? "15.2 IDALA peut modifier unilatéralement les CGU portant sur des aspects techniques de la Plateforme, dès lors qu'il n'en résulte ni augmentation de prix ni altération de la qualité, et que les caractéristiques auxquelles l'Utilisateur a subordonné son engagement figuraient dans les CGU."
              : '15.2 IDALA may unilaterally amend the Terms relating to technical aspects of the Platform, provided this results in neither a price increase nor a reduction in quality, and that the characteristics on which the User made their commitment appeared in the Terms.'}</p>
            <p>{lang === 'fr'
              ? "15.3 Pour toute autre modification, IDALA informe l'Utilisateur, par tout moyen, au moins trente (30) jours avant son entrée en vigueur. À défaut d'opposition dans ce délai, les modifications sont réputées acceptées. En cas d'opposition, l'Utilisateur peut résilier les CGU sans frais et cesse d'utiliser la Plateforme, sous réserve de la parfaite exécution des Réservations confirmées en cours."
              : '15.3 For any other amendment, IDALA informs the User, by any means, at least thirty (30) days before it takes effect. Failing objection within this period, the amendments are deemed accepted. In the event of objection, the User may terminate the Terms free of charge and stop using the Platform, subject to the proper performance of confirmed Bookings in progress.'}</p>
          </section>

          <section className="legal-article">
            <h2>{lang === 'fr' ? 'Article 16 : Droit applicable et juridiction' : 'Article 16 : Governing law and jurisdiction'}</h2>
            <p>{lang === 'fr' ? 'Les CGU sont régies par le droit français.' : 'The Terms are governed by French law.'}</p>
            <p>{lang === 'fr'
              ? "16.1 Litige avec un Utilisateur professionnel : compétence de la juridiction compétente conformément aux règles de droit commun."
              : '16.1 Dispute with a professional User: jurisdiction of the competent court in accordance with ordinary law.'}</p>
            <p>{lang === 'fr'
              ? "16.2 Litige avec un Utilisateur consommateur : conformément à l'article R. 631-3 du Code de la consommation, le consommateur peut saisir, outre l'une des juridictions territorialement compétentes au titre du Code de procédure civile, la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable."
              : '16.2 Dispute with a consumer User: in accordance with Article R. 631-3 of the Consumer Code, the consumer may bring proceedings before, in addition to one of the territorially competent courts under the Code of Civil Procedure, the court of the place where they resided at the time of conclusion of the contract or of the occurrence of the harmful event.'}</p>
          </section>

        </div>
      </div>
      <Footer />
    </>
  )
}