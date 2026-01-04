import { Router } from 'express';
import type { Request, Response } from 'express';
import { rideService } from '../services/rideService.js';
import type { Address, CancellationReason, CancelledBy } from '@ride-hailing/shared-types';

const router: Router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

router.get('/rides/active', (_req: Request, res: Response) => {
  try {
    const rides = rideService.getActive();
    res.json({ success: true, data: rides });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get active rides' });
  }
});

router.get('/rides', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const { rides, total } = rideService.getPaginated(page, pageSize);

    res.json({
      success: true,
      data: {
        items: rides,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get rides' });
  }
});

router.get('/rides/:id', (req: Request, res: Response) => {
  try {
    const ride = rideService.getWithDetails(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get ride' });
  }
});

router.get('/rides/:id/transitions', (req: Request, res: Response) => {
  try {
    const transitions = rideService.getTransitions(req.params.id);
    res.json({ success: true, data: transitions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get transitions' });
  }
});

router.get('/rides/:id/breadcrumbs', (req: Request, res: Response) => {
  try {
    const breadcrumbs = rideService.getBreadcrumbs(req.params.id);
    res.json({ success: true, data: breadcrumbs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get breadcrumbs' });
  }
});

router.post('/rides', (req: Request, res: Response) => {
  try {
    const { customerId, pickup, dropoff } = req.body as {
      customerId: string;
      pickup: Address;
      dropoff: Address;
    };

    if (!customerId || !pickup || !dropoff) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const ride = rideService.create(customerId, pickup, dropoff);
    res.status(201).json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create ride' });
  }
});

router.post('/rides/:id/cancel', (req: Request, res: Response) => {
  try {
    const { reason, cancelledBy, notes } = req.body as {
      reason: CancellationReason;
      cancelledBy: CancelledBy;
      notes?: string;
    };

    const ride = rideService.cancel(req.params.id, cancelledBy, reason, notes);
    if (!ride) {
      return res.status(404).json({ success: false, error: 'Ride not found' });
    }
    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel ride' });
  }
});

router.get('/stats/rides', (_req: Request, res: Response) => {
  try {
    const stats = rideService.getStatsByState();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

router.get('/partners', (_req: Request, res: Response) => {
  try {
    const partners = rideService.getAllPartners();
    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get partners' });
  }
});

router.get('/partners/online', (_req: Request, res: Response) => {
  try {
    const partners = rideService.getOnlinePartners();
    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get online partners' });
  }
});

router.get('/partners/available', (_req: Request, res: Response) => {
  try {
    const partners = rideService.getAvailablePartners();
    res.json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get available partners' });
  }
});

router.get('/partners/:id', (req: Request, res: Response) => {
  try {
    const partner = rideService.getPartner(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }
    res.json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get partner' });
  }
});

router.get('/partners/:id/active-ride', (req: Request, res: Response) => {
  try {
    const ride = rideService.getActiveByPartner(req.params.id);
    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get active ride' });
  }
});

router.get('/customers', (_req: Request, res: Response) => {
  try {
    const customers = rideService.getAllCustomers();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get customers' });
  }
});

router.get('/customers/:id', (req: Request, res: Response) => {
  try {
    const customer = rideService.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get customer' });
  }
});

router.get('/customers/:id/active-ride', (req: Request, res: Response) => {
  try {
    const ride = rideService.getActiveByCustomer(req.params.id);
    res.json({ success: true, data: ride });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get active ride' });
  }
});

router.get('/cancellations', (_req: Request, res: Response) => {
  try {
    const cancellations = rideService.getAllCancellations();
    res.json({ success: true, data: cancellations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get cancellations' });
  }
});

router.get('/stats/cancellations', (_req: Request, res: Response) => {
  try {
    const stats = rideService.getCancellationStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get cancellation stats' });
  }
});

export default router;
